/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CaseWareShell } from './components/layout/CaseWareShell';
import { AtlasProvider } from './store/AtlasContext';

export default function App() {
  return (
    <AtlasProvider>
      <CaseWareShell />
    </AtlasProvider>
  );
}
