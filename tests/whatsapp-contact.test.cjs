const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

function loadContactModule(filename, rejectOpening = false) {
  const alerts = [];
  const urls = [];
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, '../src/presentation/utils', filename), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const dependencies = {
    'lucide-react-native': {},
    'react-native': {
      Linking: { openURL: async (url) => {
        urls.push(url);
        if (rejectOpening) throw new Error('Opening unavailable');
      } },
    },
    '@/presentation/utils/format-date': {
      formatClockTime: () => '12:00',
      formatReservationDate: () => '22/11/2026',
    },
    '@/presentation/utils/app-alert': {
      appAlert: (title, message, buttons) => alerts.push({ title, message, buttons }),
    },
  };
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
  });
  return { api: exports, alerts, urls };
}

const scenarios = [
  ['services', 'whatsapp-services.ts', (api) => api.contactWhatsAppService(api.WHATSAPP_SERVICES[0])],
  ['help', 'whatsapp-services.ts', (api) => api.contactWhatsAppHelp()],
  ['company registration', 'whatsapp-services.ts', (api) => api.contactWhatsAppCompanyRegistration()],
  ['reservations', 'whatsapp-services.ts', (api) => api.contactWhatsAppReservation({
    origin: 'Office', destination: 'Airport', scheduledAt: new Date('2026-11-22T15:00:00Z'),
    notes: null, passengerName: null, passengerEmail: null,
  }, () => {})],
  ['reservation cancellations', 'whatsapp-services.ts', (api) => api.contactWhatsAppToCancelReservation('TR-123')],
  ['refund claims', 'refund-claim-whatsapp.ts', (api) => api.contactWhatsAppRefundClaim({
    publicCode: 'TR-123', cancelledAt: null, formattedAmount: '$100',
    passengerName: null, passengerEmail: null,
  })],
];

for (const [name, filename, contact] of scenarios) {
  test(`${name} uses the new second line and preserves the first line`, async () => {
    const { api, alerts, urls } = loadContactModule(filename);
    contact(api);
    const buttons = alerts[0].buttons;
    assert.equal(buttons[0].text, 'Línea 1 · 351 926-0326');
    assert.equal(buttons[1].text, 'Línea 2 · 351 590-1798');
    assert.equal(buttons[2].style, 'cancel');
    buttons[0].onPress();
    buttons[1].onPress();
    await new Promise(setImmediate);
    assert.equal(new URL(urls[0]).pathname, '/5493519260326');
    assert.equal(new URL(urls[1]).pathname, '/5493515901798');
    assert.equal(new URL(urls[0]).search, new URL(urls[1]).search);
  });

  test(`${name} shows the new number when opening WhatsApp fails`, async () => {
    const { api, alerts } = loadContactModule(filename, true);
    contact(api);
    alerts[0].buttons[1].onPress();
    await new Promise(setImmediate);
    assert.equal(alerts[1].title, 'No pudimos abrir WhatsApp');
    assert.equal(alerts[1].message, 'Escribinos al 351 926-0326 o al 351 590-1798.');
  });
}
