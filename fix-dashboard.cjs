const fs = require('fs');
const path = 'src/pages/Dashboard.tsx';
let lines = fs.readFileSync(path, 'utf8').split(/\n/);

// Keep through line 1170 (1-indexed), drop duplicate Right Column
const head = lines.slice(0, 1170);
const tail = [
  '',
  '      <DashboardTour />',
  '    </div>',
  '  );',
  '}',
  '',
];
let out = head.concat(tail).join('\n');

if (!out.includes('DashboardTour')) {
  // shouldn't happen — we just added it
}

if (!/import \{ DashboardTour \}/.test(out)) {
  out = out.replace(
    'import { WhatChanged } from "../components/WhatChanged";\n',
    'import { WhatChanged } from "../components/WhatChanged";\nimport { DashboardTour } from "../components/DashboardTour";\nimport { SyncIndicator } from "../components/SyncIndicator";\n',
  );
}

out = out.replace(
  'import CompareLinesPanel from "../components/CompareLinesPanel";\nimport { WhatsChangedPanel } from "../components/WhatsChangedPanel";\n',
  'import CompareLinesPanel from "../components/CompareLinesPanel";\n',
);

fs.writeFileSync(path, out);
console.log('wrote', path, 'lines', out.split(/\n/).length);
