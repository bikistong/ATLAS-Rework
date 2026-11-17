import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { atlasReducerWithOutcome, createDefaultAtlasState } from '../store/AtlasContext';
import { canSignOffA110Prepared, canSignOffA150Prepared } from './a1Formulas';
import { isIndexVisibleForWorkspace } from './formatters';

describe('Modul A1 Formula, Cascade & Gates', () => {
  it('sinkronisasi A1102.1 (PMK 55/155) ke A1102.q6IndikasiTppu secara otomatis dan memicu risiko High di A110', () => {
    const base = createDefaultAtlasState();
    const res = atlasReducerWithOutcome(base, {
      type: 'UPDATE_A1102_1',
      kodeKriteria: 'P-A1',
      patch: { jawaban: 'Ya', penjelasan: 'Komisaris tercatat sebagai pejabat negara.' },
    });

    const eng = res.state.workspaces[res.state.activeEngagementId!];
    assert.equal(eng.a1102.q6IndikasiTppu, 'Ya');
    assert.equal(eng.a1102.simpulanRisiko, 'High');
    assert.equal(eng.a110.risikoIntegritas, 'High');
    assert.equal(eng.a110.ringkasanRisikoGabungan, 'High');

    // Mencoba memanipulasi q6 lewat UPDATE_A1102 tidak boleh mengubah status dari A1102.1
    const spoofAttempt = atlasReducerWithOutcome(res.state, {
      type: 'UPDATE_A1102',
      patch: { q1ReputasiBuruk: 'Tidak' },
    });
    const engAfter = spoofAttempt.state.workspaces[spoofAttempt.state.activeEngagementId!];
    assert.equal(engAfter.a1102.q6IndikasiTppu, 'Ya');
  });

  it('memblokir Sign-Off Prepared pada A110 bila High + YA namun mitigasiRisiko < 50 karakter', () => {
    const gateFail = canSignOffA110Prepared({
      kriteriaIsuTerdahulu:
        'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia dan telah diaudit auditor independen lain atau auditor yang bersangkutan',
      risikoJenisUsaha: 'Low',
      risikoKepemilikan: 'Low',
      risikoSak: 'Low',
      risikoIsuTerdahulu: 'Low',
      risikoIntegritas: 'High',
      risikoKompetensiIndependensi: 'Low',
      risikoAuditorPendahulu: 'N/A',
      ringkasanRisikoGabungan: 'High',
      keputusanPenerimaan: 'YA',
      mitigasiRisiko: 'Terlalu singkat',
    });
    assert.equal(gateFail.allowed, false);

    // Uji langsung di reducer
    let state = createDefaultAtlasState();
    const engId = state.activeEngagementId!;
    // Reset A110 ke Draft & ubah A1101 ke Ya -> High
    state = {
      ...state,
      workspaces: {
        ...state.workspaces,
        [engId]: {
          ...state.workspaces[engId],
          workingPapers: {
            ...state.workspaces[engId].workingPapers,
            A110: { ...state.workspaces[engId].workingPapers['A110'], status: 'Draft' },
          },
        },
      },
    };
    state = atlasReducerWithOutcome(state, {
      type: 'UPDATE_A1101',
      patch: { q3RugiBerlanjut: 'Ya' },
    }).state;

    const blockedSign = atlasReducerWithOutcome(state, {
      type: 'SIGN_OFF_WORKPAPER',
      kodeIndeks: 'A110',
      operation: 'markPrepared',
    });
    assert.equal(blockedSign.state.workspaces[engId].workingPapers['A110'].status, 'Draft');
    assert.equal(blockedSign.notice?.type, 'warning');

    // Setelah isi >= 50 karakter, harus lolos
    const withMitigation = atlasReducerWithOutcome(state, {
      type: 'UPDATE_A110',
      patch: {
        mitigasiRisiko:
          'Menugaskan manager berpengalaman khusus untuk analisis kelangsungan usaha dan menaikkan jam EQCR.',
      },
    }).state;
    const allowedSign = atlasReducerWithOutcome(withMitigation, {
      type: 'SIGN_OFF_WORKPAPER',
      kodeIndeks: 'A110',
      operation: 'markPrepared',
    });
    assert.equal(allowedSign.state.workspaces[engId].workingPapers['A110'].status, 'Prepared');
  });

  it('memblokir Sign-Off Prepared pada A150 jika masih ada anggota tim Pending atau Declined', () => {
    const base = createDefaultAtlasState();
    const engId = base.activeEngagementId!;
    const ws = base.workspaces[engId];

    assert.equal(canSignOffA150Prepared(ws.a150Declarations, ws.teamMembers).allowed, false);

    const blockedOutcome = atlasReducerWithOutcome(base, {
      type: 'SIGN_OFF_WORKPAPER',
      kodeIndeks: 'A150',
      operation: 'markPrepared',
    });
    assert.equal(blockedOutcome.state.workspaces[engId].workingPapers['A150'].status, 'Kosong');
    assert.equal(blockedOutcome.notice?.type, 'warning');

    // Tandatangani seluruh anggota tim
    let nextState = base;
    for (const tm of ws.teamMembers) {
      nextState = atlasReducerWithOutcome(nextState, {
        type: 'UPDATE_A150_DECLARATION',
        userId: tm.userId,
        patch: {
          statusDeklarasi: 'Signed',
          metodeTandatangan: 'Digital PIN',
          tanggalTandatangan: '2024-01-19',
          isConflictFree: true,
        },
      }).state;
    }

    const okOutcome = atlasReducerWithOutcome(nextState, {
      type: 'SIGN_OFF_WORKPAPER',
      kodeIndeks: 'A150',
      operation: 'markPrepared',
    });
    assert.equal(okOutcome.state.workspaces[engId].workingPapers['A150'].status, 'Prepared');
  });

  it('menghitung visibilitas kondisional A1105 dan A170 secara dinamis saat tipePerikatan atau kriteriaIsuTerdahulu berubah', () => {
    const base = createDefaultAtlasState();
    const engId = base.activeEngagementId!;

    // Default Perikatan Berulang -> A1105 & A170 tersembunyi
    assert.equal(isIndexVisibleForWorkspace('A1105', base.workspaces[engId]), false);
    assert.equal(isIndexVisibleForWorkspace('A170', base.workspaces[engId]), false);

    // Ubah ke Perikatan Tahun Pertama (dengan kriteria diaudit auditor terdahulu) -> keduanya tampil
    const yearOne = atlasReducerWithOutcome(base, {
      type: 'UPDATE_ENGAGEMENT_HEADER',
      patch: { tipePerikatan: 'Perikatan Tahun Pertama' },
      sourceIndeks: 'A110',
    }).state;
    assert.equal(isIndexVisibleForWorkspace('A1105', yearOne.workspaces[engId]), true);
    assert.equal(isIndexVisibleForWorkspace('A170', yearOne.workspaces[engId]), true);

    // Ubah kriteria ke belum pernah diaudit -> A170 tampil, A1105 tersembunyi
    const unaudited = atlasReducerWithOutcome(yearOne, {
      type: 'UPDATE_A110',
      patch: {
        kriteriaIsuTerdahulu:
          'Entitas berdiri sejak lama dan Laporan keuangan periode sebelumnya tersedia namun belum pernah diaudit',
      },
    }).state;
    assert.equal(isIndexVisibleForWorkspace('A1105', unaudited.workspaces[engId]), false);
    assert.equal(isIndexVisibleForWorkspace('A170', unaudited.workspaces[engId]), true);
  });

  it('mensinkronkan pilihan personel A1103B ke teamMembers dan a150Declarations serta mematuhi SA 230 Lock Guard', () => {
    const base = createDefaultAtlasState();
    const engId = base.activeEngagementId!;
    const rows = base.workspaces[engId].a1103.map((r, i) =>
      i === base.workspaces[engId].a1103.length - 1 ? { ...r, isSelected: false } : r
    );

    const synced = atlasReducerWithOutcome(base, {
      type: 'UPDATE_A1103',
      rows,
    }).state;
    assert.equal(synced.workspaces[engId].teamMembers.length, rows.length - 1);
    assert.equal(synced.workspaces[engId].a150Declarations.length, rows.length - 1);

    // Kunci A1102 secara SA 230 & pastikan mutasi ditolak
    const locked = {
      ...synced,
      workspaces: {
        ...synced.workspaces,
        [engId]: {
          ...synced.workspaces[engId],
          workingPapers: {
            ...synced.workspaces[engId].workingPapers,
            A1102: { ...synced.workspaces[engId].workingPapers['A1102'], status: 'Locked' as const },
          },
        },
      },
    };
    const rejected = atlasReducerWithOutcome(locked, {
      type: 'UPDATE_A1102',
      patch: { q1ReputasiBuruk: 'Ya' },
    });
    assert.equal(rejected.state.workspaces[engId].a1102.q1ReputasiBuruk, 'Tidak');
    assert.equal(rejected.notice?.type, 'warning');
  });
});
