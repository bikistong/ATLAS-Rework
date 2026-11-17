import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import FileSaver from 'file-saver';
import { OPINION_TEMPLATES } from '../../data/cModuleCatalog';
import {
  ClientEntity,
  EngagementWorkspaceData,
  KapProfile,
  UserProfile,
} from '../../types/atlas';
import { formatOfficialLaiNumber } from '../../utils/cModuleFormulas';
import { formatIdDate } from '../../utils/formatters';

function saveDocxBlob(blob: Blob, filename: string): void {
  const saveFn =
    typeof FileSaver === 'function'
      ? FileSaver
      : (FileSaver as unknown as { saveAs?: (data: Blob, name: string) => void }).saveAs;
  if (saveFn) {
    saveFn(blob, filename);
  }
}

const FONT_NAME = 'Times New Roman';

function headingParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: FONT_NAME,
        size: 22,
      }),
    ],
  });
}

function bodyParagraph(text: string, spacingAfter = 140): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: spacingAfter, line: 276 },
    children: [
      new TextRun({
        text,
        font: FONT_NAME,
        size: 22,
      }),
    ],
  });
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    bullet: { level: 0 },
    spacing: { after: 80, line: 276 },
    children: [
      new TextRun({
        text,
        font: FONT_NAME,
        size: 22,
      }),
    ],
  });
}

export async function generateLaiDocx(params: {
  kapProfile: KapProfile;
  client: ClientEntity;
  workspace: EngagementWorkspaceData;
  signingPartner: UserProfile;
}): Promise<string> {
  const { kapProfile, client, workspace, signingPartner } = params;
  const c400 = workspace.moduleC.c400Opinion;
  const template = OPINION_TEMPLATES[c400.selectedOpinion];
  const laiNumber = formatOfficialLaiNumber({
    reportSequenceNumber: c400.reportSequenceNumber,
    sak: client.sakDigunakan,
    branchCode: c400.branchCode,
    tanggalLaporanAuditor: workspace.header.tanggalLaporanAuditor,
  });

  const periodeSelesaiText = formatIdDate(workspace.header.periodeSelesai);
  const periodeText = `tanggal ${periodeSelesaiText}`;
  const tanggalLaitext = formatIdDate(workspace.header.tanggalLaporanAuditor);

  const paragraphs: Paragraph[] = [
    // Kop Surat KAP (100% dinamis dari Master KAP)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: kapProfile.namaKap.toUpperCase(),
          bold: true,
          font: FONT_NAME,
          size: 26,
          color: '0F172A',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: `Registered Public Accountants · Izin Usaha KAP No. ${kapProfile.nomorIzinKap}`,
          font: FONT_NAME,
          size: 18,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      border: {
        bottom: {
          color: '1E293B',
          style: BorderStyle.DOUBLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: `${kapProfile.alamat}, ${kapProfile.kota} · Telp: ${kapProfile.telepon} · Email: ${kapProfile.email}`,
          font: FONT_NAME,
          size: 18,
          color: '475569',
        }),
      ],
    }),

    // Judul Resmi LAI (SA 700.21)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new TextRun({
          text: 'LAPORAN AUDITOR INDEPENDEN',
          bold: true,
          font: FONT_NAME,
          size: 26,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `No. Laporan: ${laiNumber}`,
          bold: true,
          font: FONT_NAME,
          size: 21,
        }),
      ],
    }),

    // Pihak yang Dituju (SA 700.22)
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: c400.targetedTo || 'Pemegang Saham, Dewan Komisaris, dan Direksi',
          bold: true,
          font: FONT_NAME,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: client.namaKlien,
          bold: true,
          font: FONT_NAME,
          size: 22,
        }),
      ],
    }),

    // 1. Paragraf Opini (SA 700 / SA 705)
    headingParagraph(template.opinionHeading),
    bodyParagraph(
      `Kami telah mengaudit laporan keuangan ${client.namaKlien} (“Entitas”), yang terdiri dari laporan posisi keuangan ${periodeText}, serta laporan laba rugi dan penghasilan komprehensif lain, laporan perubahan ekuitas, dan laporan arus kas untuk tahun yang berakhir pada tanggal tersebut, serta catatan atas laporan keuangan, termasuk ikhtisar kebijakan akuntansi signifikan.`
    ),
    bodyParagraph(
      template.opinionLeadParagraph({
        clientName: client.namaKlien,
        periodeText,
        sak: client.sakDigunakan,
      })
    ),

    // 2. Basis Opini & Basis Modifikasi (jika OPINI2..OPINI5)
    headingParagraph(
      template.requiresModificationBasis
        ? `Basis untuk ${template.opinionHeading}`
        : 'Basis Opini'
    ),
  ];

  if (template.requiresModificationBasis && c400.basisForModificationText.trim()) {
    paragraphs.push(bodyParagraph(c400.basisForModificationText.trim()));
  }

  if (c400.selectedOpinion === 'OPINI5') {
    paragraphs.push(
      bodyParagraph(
        'Kami tidak dapat memperoleh bukti audit yang cukup dan tepat untuk menyediakan suatu basis bagi opini audit atas laporan keuangan tersebut sebagaimana dijelaskan di atas.'
      )
    );
  } else {
    paragraphs.push(
      bodyParagraph(
        `Kami melaksanakan audit kami berdasarkan Standar Audit yang ditetapkan oleh Institut Akuntan Publik Indonesia. Tanggung jawab kami menurut standar tersebut diuraikan lebih lanjut dalam paragraf Tanggung Jawab Auditor terhadap Audit atas Laporan Keuangan pada laporan kami. Kami independen terhadap Entitas berdasarkan ketentuan etika yang relevan dalam audit kami atas laporan keuangan di Indonesia, dan kami telah memenuhi tanggung jawab etika lainnya berdasarkan ketentuan tersebut. Kami yakin bahwa bukti audit yang telah kami peroleh adalah cukup dan tepat untuk menyediakan suatu basis bagi opini ${template.requiresModificationBasis ? 'modifikasian ' : ''}kami.`
      )
    );
  }

  // 3. Ketidakpastian Material Terkait Kelangsungan Usaha (SA 570)
  if (c400.hasMaterialUncertaintyGoingConcern) {
    paragraphs.push(
      headingParagraph('Ketidakpastian Material Terkait dengan Kelangsungan Usaha'),
      bodyParagraph(
        `Kami menarik perhatian pada ${c400.goingConcernCalkRef || 'Catatan atas Laporan Keuangan'} yang mengungkapkan kondisi atau peristiwa yang mengindikasikan adanya ketidakpastian material yang dapat menimbulkan keraguan signifikan tentang kemampuan Entitas untuk mempertahankan kelangsungan usahanya. Opini kami tidak dimodifikasi sehubungan dengan hal tersebut.`
      )
    );
  }

  // 4. Penekanan Suatu Hal (SA 706)
  if (c400.hasEmphasisOfMatter && c400.emphasisOfMatterText.trim()) {
    paragraphs.push(
      headingParagraph('Penekanan Suatu Hal'),
      bodyParagraph(
        `Kami menarik perhatian pada ${c400.emphasisCalkRef ? `${c400.emphasisCalkRef} ` : ''}${c400.emphasisOfMatterText.trim()} Opini kami tidak dimodifikasi sehubungan dengan hal tersebut.`
      )
    );
  }

  // 5. Hal Lain (SA 706)
  if (c400.hasOtherMatter && c400.otherMatterText.trim()) {
    paragraphs.push(
      headingParagraph('Hal Lain'),
      bodyParagraph(c400.otherMatterText.trim())
    );
  }

  // 6. Tanggung Jawab Manajemen
  paragraphs.push(
    headingParagraph(
      'Tanggung Jawab Manajemen dan Pihak yang Bertanggung Jawab atas Tata Kelola terhadap Laporan Keuangan'
    ),
    bodyParagraph(
      `Manajemen bertanggung jawab atas penyusunan dan penyajian wajar laporan keuangan tersebut sesuai dengan ${client.sakDigunakan} di Indonesia, dan atas pengendalian internal yang dianggap perlu oleh manajemen untuk memungkinkan penyusunan laporan keuangan yang bebas dari kesalahan penyajian material, baik yang disebabkan oleh kecurangan maupun kesalahan.`
    ),
    bodyParagraph(
      'Dalam penyusunan laporan keuangan, manajemen bertanggung jawab untuk menilai kemampuan Entitas dalam mempertahankan kelangsungan usahanya, mengungkapkan, sesuai dengan kondisinya, hal-hal yang berkaitan dengan kelangsungan usaha, dan menggunakan basis akuntansi kelangsungan usaha kecuali manajemen memiliki intensi untuk melikuidasi Entitas atau menghentikan operasi, atau tidak memiliki alternatif yang realistis selain melaksanakannya.'
    ),
    bodyParagraph(
      'Pihak yang bertanggung jawab atas tata kelola bertanggung jawab untuk mengawasi proses pelaporan keuangan Entitas.'
    ),

    // 7. Tanggung Jawab Auditor
    headingParagraph('Tanggung Jawab Auditor terhadap Audit atas Laporan Keuangan'),
    bodyParagraph(
      'Tujuan kami adalah untuk memperoleh keyakinan memadai tentang apakah laporan keuangan secara keseluruhan bebas dari kesalahan penyajian material, baik yang disebabkan oleh kecurangan maupun kesalahan, dan untuk menerbitkan laporan auditor yang mencakup opini kami. Keyakinan memadai merupakan suatu tingkat keyakinan tinggi, namun bukan merupakan suatu jaminan bahwa audit yang dilaksanakan berdasarkan Standar Audit akan selalu mendeteksi kesalahan penyajian material ketika hal tersebut ada. Kesalahan penyajian dapat disebabkan oleh kecurangan maupun kesalahan dan dianggap material jika, baik secara individual maupun secara agregat, dapat diekspektasikan secara wajar akan memengaruhi keputusan ekonomi yang diambil oleh pengguna berdasarkan laporan keuangan tersebut.'
    ),
    bodyParagraph(
      'Sebagai bagian dari suatu audit berdasarkan Standar Audit, kami menerapkan pertimbangan profesional dan mempertahankan skeptisisme profesional selama audit. Kami juga:'
    ),
    bulletParagraph(
      'Mengidentifikasi dan menilai risiko kesalahan penyajian material dalam laporan keuangan, baik yang disebabkan oleh kecurangan maupun kesalahan, mendesain dan melaksanakan prosedur audit yang responsif terhadap risiko tersebut, serta memperoleh bukti audit yang cukup dan tepat untuk menyediakan basis bagi opini kami.'
    ),
    bulletParagraph(
      'Memperoleh suatu pemahaman tentang pengendalian internal yang relevan dengan audit untuk mendesain prosedur audit yang tepat sesuai dengan kondisinya, tetapi bukan untuk tujuan menyatakan opini atas keefektivitasan pengendalian internal Entitas.'
    ),
    bulletParagraph(
      'Mengevaluasi ketepatan kebijakan akuntansi yang digunakan serta kewajaran estimasi akuntansi dan pengungkapan terkait yang dibuat oleh manajemen.'
    ),
    bulletParagraph(
      'Menyimpulkan ketepatan penggunaan basis akuntansi kelangsungan usaha oleh manajemen dan, berdasarkan bukti audit yang diperoleh, apakah terdapat suatu ketidakpastian material yang terkait dengan peristiwa atau kondisi yang dapat menyebabkan keraguan signifikan atas kemampuan Entitas untuk mempertahankan kelangsungan usahanya.'
    ),
    bulletParagraph(
      'Mengevaluasi penyajian, struktur, dan isi laporan keuangan secara keseluruhan, termasuk pengungkapannya, dan apakah laporan keuangan mencerminkan transaksi dan peristiwa yang mendasarinya dengan suatu cara yang mencapai penyajian wajar.'
    ),
    bodyParagraph(
      'Kami mengomunikasikan kepada pihak yang bertanggung jawab atas tata kelola mengenai, antara lain, ruang lingkup dan saat yang direncanakan atas audit, serta temuan audit signifikan, termasuk setiap defisiensi signifikan dalam pengendalian internal yang teridentifikasi oleh kami selama audit.'
    ),

    // 8. Blok Tanda Tangan AP (100% Dinamis dari Master Users & KAP Profile)
    new Paragraph({
      spacing: { before: 320, after: 40 },
      children: [
        new TextRun({
          text: kapProfile.namaKap.toUpperCase(),
          bold: true,
          font: FONT_NAME,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 640 },
      children: [
        new TextRun({
          text: `Izin Usaha KAP No. ${kapProfile.nomorIzinKap}`,
          font: FONT_NAME,
          size: 20,
          color: '475569',
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: signingPartner.namaLengkap,
          bold: true,
          underline: {},
          font: FONT_NAME,
          size: 22,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 20 },
      children: [
        new TextRun({
          text: `Registrasi Akuntan Publik No. ${signingPartner.nomorRegistrasi}`,
          font: FONT_NAME,
          size: 21,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: `${kapProfile.kota}, ${tanggalLaitext}`,
          font: FONT_NAME,
          size: 21,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 1418,
              bottom: 1418,
              right: 1418,
              left: 1701,
            },
          },
        },
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const safeClient = client.namaKlien.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  const filename = `LAI_${safeClient}_${workspace.header.tahunBuku}.docx`;
  saveDocxBlob(blob, filename);
  return filename;
}
