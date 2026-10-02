// ===== Shared product catalog (demo data) =====
const BUILTIN_PRODUCTS = [
  {id:1, name:'Arduino Uno R3', cat:'Dev Boards', icon:'\uD83D\uDD37', price:23.90, stock:140, tag:'Popular', rating:4.8, reviews:312, sku:'EH-ARD-UNO',
   desc:'ATmega328P microcontroller board, 14 digital I/O pins, USB.',
   long:'The Arduino Uno R3 is the most widely used development board for learning electronics and prototyping. Based on the ATmega328P, it offers 14 digital I/O pins (6 PWM), 6 analog inputs, a 16 MHz crystal, USB connection, power jack and reset button \u2014 everything needed to get started.',
   specs:[['Microcontroller','ATmega328P'],['Operating Voltage','5V'],['Digital I/O Pins','14 (6 PWM)'],['Analog Inputs','6'],['Flash Memory','32 KB'],['Clock Speed','16 MHz']]},
  {id:2, name:'Raspberry Pi 4 (4GB)', cat:'Dev Boards', icon:'\uD83C\uDF53', price:68.00, stock:32, tag:'Hot', rating:4.9, reviews:540, sku:'EH-RPI-4B4',
   desc:'Quad-core Cortex-A72, dual 4K HDMI, Gigabit Ethernet.',
   long:'The Raspberry Pi 4 Model B delivers desktop-class performance in a tiny footprint. With a quad-core 64-bit processor, 4GB RAM, dual-band Wi-Fi, Gigabit Ethernet and dual 4K HDMI outputs, it is ideal for IoT hubs, media centers and edge computing.',
   specs:[['SoC','Broadcom BCM2711'],['CPU','Quad-core Cortex-A72 @1.5GHz'],['RAM','4GB LPDDR4'],['Connectivity','Wi-Fi 5, BT 5.0, GbE'],['Video','2\u00D7 micro-HDMI (4K)'],['USB','2\u00D7 USB3, 2\u00D7 USB2']]},
  {id:3, name:'ESP32 DevKit v1', cat:'Dev Boards', icon:'\uD83D\uDCF6', price:8.50, stock:210, rating:4.7, reviews:198, sku:'EH-ESP-32V1',
   desc:'Wi-Fi + Bluetooth SoC, dual-core, 30 GPIO breakout.',
   long:'The ESP32 DevKit v1 is a low-cost, low-power SoC with integrated Wi-Fi and dual-mode Bluetooth. Its dual-core processor and rich peripheral set make it the go-to choice for connected IoT projects.',
   specs:[['Chip','ESP32-WROOM-32'],['CPU','Dual-core @240MHz'],['Wireless','Wi-Fi b/g/n + BT 4.2'],['GPIO','30 pins'],['Flash','4 MB'],['Operating Voltage','3.3V']]},
  {id:4, name:'1/4W Resistor Kit (600pcs)', cat:'Passives', icon:'\uD83D\uDFEB', price:9.99, stock:500, rating:4.6, reviews:88, sku:'EH-RES-600',
   desc:'30 values, 5% tolerance carbon film resistors, sorted box.',
   long:'A well-organized assortment of 600 carbon film resistors spanning 30 common values from 10\u03A9 to 1M\u03A9, each labeled in its own compartment. Essential for any workbench.',
   specs:[['Type','Carbon film'],['Power','1/4 W'],['Tolerance','\u00B15%'],['Values','30 (10\u03A9\u20131M\u03A9)'],['Quantity','600 pcs'],['Packaging','Sorted box']]},
  {id:5, name:'Ceramic Capacitor Kit', cat:'Passives', icon:'\u26AA', price:7.25, stock:380, rating:4.5, reviews:64, sku:'EH-CAP-CER',
   desc:'500pcs assorted 10pF\u2013100nF ceramic capacitors.',
   long:'500-piece ceramic disc capacitor assortment covering 10pF to 100nF across common values, ideal for decoupling, filtering and timing circuits.',
   specs:[['Type','Ceramic disc'],['Range','10pF\u2013100nF'],['Voltage','50V'],['Tolerance','\u00B110%'],['Quantity','500 pcs'],['Values','Assorted']]},
  {id:6, name:'Electrolytic Capacitor Set', cat:'Passives', icon:'\uD83E\uDED9', price:11.40, stock:0, rating:4.4, reviews:51, sku:'EH-CAP-ELE',
   desc:'120pcs 0.1uF\u20131000uF 16\u201350V radial capacitors.',
   long:'A compact box of 120 radial electrolytic capacitors from 0.1uF to 1000uF, rated 16\u201350V \u2014 perfect for power supply smoothing and audio projects.',
   specs:[['Type','Radial electrolytic'],['Range','0.1uF\u20131000uF'],['Voltage','16\u201350V'],['Tolerance','\u00B120%'],['Quantity','120 pcs'],['Temp','-40\u2013105\u00B0C']]},
  {id:7, name:'DHT22 Temp/Humidity Sensor', cat:'Sensors', icon:'\uD83C\uDF21\uFE0F', price:5.60, stock:95, rating:4.6, reviews:142, sku:'EH-SEN-DHT22',
   desc:'Digital temperature & humidity sensor, \u00B10.5\u00B0C accuracy.',
   long:'The DHT22 (AM2302) is a calibrated digital sensor measuring temperature and relative humidity over a single-wire interface, with better accuracy and range than the DHT11.',
   specs:[['Measures','Temp & Humidity'],['Temp Range','-40\u201380\u00B0C'],['Temp Accuracy','\u00B10.5\u00B0C'],['Humidity','0\u2013100% RH'],['Interface','1-wire digital'],['Voltage','3.3\u20136V']]},
  {id:8, name:'HC-SR04 Ultrasonic Sensor', cat:'Sensors', icon:'\uD83D\uDCCF', price:2.80, stock:260, tag:'Deal', rating:4.5, reviews:176, sku:'EH-SEN-SR04',
   desc:'2\u2013400cm non-contact distance measuring module.',
   long:'The HC-SR04 provides stable, non-contact distance measurement from 2cm to 400cm with ranging accuracy up to 3mm. A staple for robotics and obstacle-avoidance projects.',
   specs:[['Range','2\u2013400 cm'],['Accuracy','3 mm'],['Angle','15\u00B0'],['Interface','Trigger/Echo'],['Voltage','5V'],['Frequency','40 kHz']]},
  {id:9, name:'MPU-6050 Gyro + Accel', cat:'Sensors', icon:'\uD83E\uDDED', price:4.30, stock:18, rating:4.4, reviews:97, sku:'EH-SEN-6050',
   desc:'6-axis motion tracking, I2C interface, 16-bit ADC.',
   long:'The MPU-6050 combines a 3-axis gyroscope and 3-axis accelerometer with an onboard Digital Motion Processor, delivering accurate 6-axis motion tracking over I2C.',
   specs:[['Axes','3 gyro + 3 accel'],['Gyro Range','\u00B1250\u20132000\u00B0/s'],['Accel Range','\u00B12\u201316g'],['ADC','16-bit'],['Interface','I2C'],['Voltage','3\u20135V']]},
  {id:10, name:'LM2596 Buck Converter', cat:'Power', icon:'\u26A1', price:3.10, stock:175, rating:4.7, reviews:210, sku:'EH-PWR-2596',
   desc:'Adjustable step-down DC-DC 3A, 4.5\u201340V input.',
   long:'An efficient adjustable step-down (buck) module based on the LM2596, converting 4.5\u201340V inputs down to a stable 1.25\u201337V output at up to 3A \u2014 great for powering projects from batteries.',
   specs:[['Input','4.5\u201340V'],['Output','1.25\u201337V'],['Max Current','3A'],['Efficiency','up to 92%'],['Switching','150 kHz'],['Adjust','Multiturn pot']]},
  {id:11, name:'18650 Li-ion Cell 3400mAh', cat:'Power', icon:'\uD83D\uDD0B', price:6.90, stock:88, rating:4.5, reviews:133, sku:'EH-PWR-18650',
   desc:'Rechargeable 3.7V protected cell, button top.',
   long:'High-capacity 3400mAh protected 18650 lithium-ion cell with button top, suitable for power banks, flashlights and portable electronics.',
   specs:[['Capacity','3400 mAh'],['Voltage','3.7V nominal'],['Chemistry','Li-ion'],['Protection','PCB protected'],['Type','Button top'],['Cycles','~500']]},
  {id:12, name:'5V 2A USB Power Supply', cat:'Power', icon:'\uD83D\uDD0C', price:7.80, stock:120, rating:4.6, reviews:76, sku:'EH-PWR-5V2A',
   desc:'Regulated wall adapter with micro-USB cable.',
   long:'A regulated 5V 2A wall adapter with a detachable micro-USB cable, providing clean, stable power for dev boards and single-board computers.',
   specs:[['Output','5V 2A'],['Input','100\u2013240V AC'],['Connector','Micro-USB'],['Regulation','\u00B15%'],['Protection','OVP/OCP'],['Cable','1.2 m']]},
  {id:13, name:'5mm LED Assortment (200pcs)', cat:'Components', icon:'\uD83D\uDCA1', price:4.50, stock:300, rating:4.7, reviews:120, sku:'EH-CMP-LED200',
   desc:'5 colors, diffused & clear, with resistors included.',
   long:'200 assorted 5mm LEDs in red, green, blue, yellow and white (diffused and clear), bundled with matching current-limiting resistors.',
   specs:[['Size','5 mm'],['Colors','5'],['Forward Voltage','1.8\u20133.2V'],['Current','20 mA'],['Quantity','200 pcs'],['Extras','Resistors included']]},
  {id:14, name:'NE555 Timer IC (10pcs)', cat:'Components', icon:'\uD83D\uDD32', price:2.20, stock:240, rating:4.8, reviews:155, sku:'EH-CMP-555',
   desc:'Classic 555 precision timer in DIP-8 package.',
   long:'A pack of 10 NE555 precision timing ICs in DIP-8 \u2014 the legendary chip for astable/monostable oscillators, PWM, and countless hobby circuits.',
   specs:[['Package','DIP-8'],['Supply','4.5\u201316V'],['Output Current','200 mA'],['Freq','up to 500 kHz'],['Quantity','10 pcs'],['Modes','Astable/Monostable']]},
  {id:15, name:'Breadboard 830 Points', cat:'Prototyping', icon:'\uD83D\uDFE9', price:4.80, stock:150, rating:4.6, reviews:201, sku:'EH-PRO-BB830',
   desc:'Solderless MB-102 breadboard with power rails.',
   long:'A standard 830 tie-point solderless breadboard (MB-102) with dual power rails \u2014 ideal for building and testing circuits without soldering.',
   specs:[['Tie Points','830'],['Power Rails','2'],['Spacing','2.54 mm'],['Material','ABS'],['Reusable','Yes'],['Compatible','22\u201329 AWG']]},
  {id:16, name:'Jumper Wire Set (120pcs)', cat:'Prototyping', icon:'\uD83E\uDDF5', price:5.40, stock:200, tag:'Deal', rating:4.5, reviews:143, sku:'EH-PRO-JMP120',
   desc:'M-M, M-F, F-F dupont wires, multiple lengths.',
   long:'120 flexible dupont jumper wires in male-male, male-female and female-female configurations across multiple lengths \u2014 everything you need for breadboard wiring.',
   specs:[['Types','M-M, M-F, F-F'],['Quantity','120 pcs'],['Lengths','10\u201320 cm'],['Pitch','2.54 mm'],['Conductor','Multi-strand'],['Colors','Assorted']]},
  {id:17, name:'Soldering Iron Kit 60W', cat:'Tools', icon:'\uD83D\uDD27', price:19.99, stock:45, rating:4.6, reviews:168, sku:'EH-TOL-SOLD60',
   desc:'Adjustable temp 200\u2013450\u00B0C, 5 tips, stand & solder.',
   long:'A complete 60W soldering kit with adjustable temperature control (200\u2013450\u00B0C), five interchangeable tips, a stand, solder wire and desoldering pump \u2014 ready for any repair job.',
   specs:[['Power','60 W'],['Temp','200\u2013450\u00B0C'],['Tips','5 included'],['Heat-up','~90 s'],['Voltage','110\u2013240V'],['Extras','Stand + solder']]},
  {id:18, name:'Digital Multimeter', cat:'Tools', icon:'\uD83D\uDCCA', price:24.50, stock:60, rating:4.7, reviews:224, sku:'EH-TOL-DMM',
   desc:'Auto-ranging DMM, measures V/A/\u03A9, continuity, diode.',
   long:'An auto-ranging digital multimeter measuring AC/DC voltage and current, resistance, continuity and diodes, with a backlit display and data hold \u2014 a lab essential.',
   specs:[['Display','6000 counts'],['DC Voltage','600V'],['AC Voltage','600V'],['Current','10A'],['Features','Continuity, diode'],['Ranging','Auto']]},
];

const CATEGORIES = ['All','Dev Boards','Sensors','Passives','Power','Components','Prototyping','Tools'];

// ===== Catalog data layer =====
// The catalog is served by the backend API (real persistence). When the API
// is unreachable (e.g. the site is opened as static files with no server),
// we gracefully fall back to the built-in demo catalog above so the
// storefront still renders.
//
// If the API is hosted on a different origin than the static site, set
//   window.ELECTROHUB_API = 'https://your-api-host';
// before this script loads. Otherwise same-origin requests are used.
const API_BASE = (typeof window !== 'undefined' && window.ELECTROHUB_API) ? window.ELECTROHUB_API : '';

// Merged/live catalog used by every page. Starts with the built-ins and is
// replaced by the API response once fetched.
let PRODUCTS = BUILTIN_PRODUCTS.slice();
let PRODUCTS_SOURCE = 'builtin'; // 'api' once loaded from the backend

// Load products from the backend. Returns the resulting array.
async function fetchProducts(){
  try {
    const res = await fetch(API_BASE + '/api/products', { credentials: 'include' });
    if(res.ok){
      const data = await res.json();
      if(Array.isArray(data)){ PRODUCTS = data; PRODUCTS_SOURCE = 'api'; }
    }
  } catch(e){ /* offline / static hosting: keep built-in fallback */ }
  return PRODUCTS;
}

// Resolve an image reference to a usable src. Uploaded files are stored as
// '/uploads/...': prefix the API origin when it differs. Data URLs and
// absolute URLs are returned unchanged.
function imgSrc(src){
  if(!src) return '';
  if(/^(data:|https?:)/i.test(src)) return src;
  if(src.charAt(0) === '/') return API_BASE + src;
  return src;
}

// Returns markup for a product thumbnail: an uploaded image if present,
// otherwise the emoji icon.
function productVisual(p){
  if(p && p.img){
    const safe = String(p.name || '')
      .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
      .replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return '<img src="' + imgSrc(p.img) + '" alt="' + safe + '">';
  }
  return (p && p.icon) ? p.icon : '\uD83D\uDCE6';
}
