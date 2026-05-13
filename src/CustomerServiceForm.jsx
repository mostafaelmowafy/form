import { useState } from 'react';

// ── ضع رابط الـ Web App هنا بعد النشر ────────────────────
const GOOGLE_SHEET_URL =
  'https://script.google.com/macros/s/AKfycbwlqKENKlPloyHmsneBHDfVvLGksQOheaGPAAk3lmm6prx7vYsDmbTi_sI9Lzj9xX2p2Q/exec';

const GOVERNORATES = [
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'الشرقية',
  'الدقهلية',
  'الغربية',
  'المنوفية',
  'القليوبية',
  'البحيرة',
  'بورسعيد',
  'السويس',
  'البحر الأحمر',
  'دمياط',
  'كفر الشيخ',
  'قنا',
  'المنيا',
  'أسيوط',
  'الإسماعيلية',
  'سوهاج',
  'أسوان',
  'بني سويف',
  'الفيوم',
  'الأقصر',
  'مطروح',
];

const C = {
  bg: '#07111f',
  header: '#0c1a30',
  field: 'rgba(255,255,255,0.04)',
  border: 'rgba(61, 102, 117, 0.55)',
  borderErr: '#f97066',
  white: '#ffffff',
  dim: 'rgba(255,255,255,0.55)',
  blue: '#4a9eff',
  brown: '#183b54',
  brownLight: '#3f7497',
  err: '#f97066',
};

// ── مكوّن الحقل مع إضافة رسالة الخطأ ──────────────────────
function Field({ label, icon, error, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          direction: 'rtl',
          border: `1px solid ${error ? C.borderErr : C.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          background: C.field,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            minWidth: 160,
            flexShrink: 0,
            borderLeft: `1px solid ${error ? C.borderErr : C.border}`,
            alignSelf: 'stretch',
          }}
        >
          <span style={{ fontSize: 14, color: C.white, fontWeight: 600 }}>
            {icon} {label}
          </span>
        </div>
        <div style={{ flex: 1, padding: '0 14px', textAlign: 'right' }}>
          {children}
        </div>
      </div>
      {error && (
        <p
          style={{ color: C.err, fontSize: 12, marginTop: 5, paddingRight: 5 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

function RadioOption({ name, value, label, checked, onChange }) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        // flex: 1,
        minWidth: 120,
        padding: '11px 14px',
        border: `1px solid ${checked ? C.blue : C.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        background: checked ? 'rgba(74,158,255,0.1)' : C.field,
        color: checked ? C.blue : C.white,
        fontSize: 14,
      }}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        style={{ accentColor: C.blue }}
      />
      {label}
    </label>
  );
}

const inputStyle = {
  width: '100%',
  padding: '13px 0',
  fontSize: 14,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  color: '#ffffff',
  direction: 'rtl',
  textAlign: 'right',
};

export default function CustomerServiceForm() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    gov: '',
    age: '',
    grad: '',
    notes: '',
    exp: '',
    avail: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [netErr, setNetErr] = useState('');

  const convertArabicNumsToEnglish = (str) => {
    return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  };

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // مسح الخطأ بمجرد الكتابة
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const phoneRegex =
      /^(?:(?:010|011|015)[0-9]{8}|(?:0127|0128|0120|0122|0121)[0-9]{7})$/;

    // تنظيف وتحويل رقم الهاتف
    const cleanPhone = convertArabicNumsToEnglish(form.phone.trim());

    if (!form.name.trim()) newErrors.name = 'يجب إدخال الاسم بالكامل';

    if (!cleanPhone) {
      newErrors.phone = 'يجب إدخال رقم الهاتف';
    } else if (!phoneRegex.test(cleanPhone)) {
      newErrors.phone =
        '❌ من فضلك أدخل رقم هاتف صحيح يبدأ بـ 010 - 011 - 015 - 0127 - 0128 - 0120 - 0121 ويتكون من 11 رقم';
    }

    if (!form.gov) newErrors.gov = 'يجب اختيار المحافظة';
    if (!form.age) newErrors.age = 'يجب إدخال العمر';
    if (!form.grad.trim()) newErrors.grad = 'يجب إدخال المؤهل الدراسي';
    if (!form.exp) newErrors.exp = 'برجاء تحديد حالة الخبرة';
    if (!form.avail) newErrors.avail = 'برجاء تحديد مدى التوافر';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function handleSubmit() {
    if (!validateForm()) return;

    setLoading(true);
    setNetErr('');

    try {
      await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        body: JSON.stringify(form),
        mode: 'no-cors',
      });
      setDone(true);
    } catch (err) {
      setNetErr('حدث خطأ في الإرسال، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (done)
    return (
      <div
        style={{
          width: '100vw',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: C.bg,
          color: C.white,
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 56 }}>✅</div>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginTop: 20 }}>
          تم تسجيل بياناتك بنجاح.
        </h2>
        <p style={{ color: C.dim, fontSize: 22 }}>
          شكراً <span style={{ color: C.blue }}>{form.name}</span>، سنتواصل معك
          في أقرب وقت ممكن.
        </p>
      </div>
    );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
        select option { background: #0c1a30; }
        
      `}</style>

      <div
        style={{
          width: '100vw',
          minHeight: '100vh',
          background: C.bg,
          fontFamily: "'Cairo', sans-serif",
          direction: 'rtl',
          color: C.white,
          textAlign: 'right',
        }}
      >
        <div
          style={{
            background: C.header,
            borderBottom: `1px solid ${C.border}`,
            padding: '28px 5vw',
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Skilled<span style={{ color: C.blue }}>oo</span>
          </h1>
          <p style={{ color: C.dim, fontSize: 14 }}>
            برجاء تسجيل البيانات وسوف نتواصل معكم في أقرب وقت ممكن
          </p>
        </div>

        <div
          style={{ padding: '24px 5vw 40px', maxWidth: 860, margin: '0 auto' }}
        >
          <Field label="الاسم بالكامل" icon="👤" error={errors.name}>
            <input
              type="text"
              placeholder="أدخل اسمك الكامل"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              style={inputStyle}
            />
          </Field>

          <Field label="رقم الهاتف" icon="📞" error={errors.phone}>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
              maxLength={11}
            />
          </Field>

          <Field label="المحافظة" icon="📍" error={errors.gov}>
            <select
              value={form.gov}
              onChange={(e) => update('gov', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">اختر المحافظة</option>
              {GOVERNORATES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Field>

          <Field label="عمرك كام سنة؟" icon="🕐" error={errors.age}>
            <input
              type="number"
              placeholder="مثال: 25"
              value={form.age}
              onChange={(e) => update('age', e.target.value)}
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
            />
          </Field>

          <Field label="خريج إيه؟" icon="🎓" error={errors.grad}>
            <input
              type="text"
              placeholder="المؤهل الدراسي"
              value={form.grad}
              onChange={(e) => update('grad', e.target.value)}
              style={inputStyle}
            />
          </Field>

          {/* الخبرة */}
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              margin: '16px 0 8px',
              paddingRight: 10,
              borderRight: `3px solid ${C.brown}`,
            }}
          >
            🎯 هل لديك خبرة في خدمة العملاء؟
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {[
              ['yes', 'نعم'],
              ['no', 'لا'],
            ].map(([v, l]) => (
              <RadioOption
                key={v}
                name="exp"
                value={v}
                label={l}
                checked={form.exp === v}
                onChange={(val) => update('exp', val)}
              />
            ))}
          </div>
          {errors.exp && (
            <p style={{ color: C.err, fontSize: 12, marginBottom: 14 }}>
              {errors.exp}
            </p>
          )}

          {/* التوافر */}
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              margin: '16px 0 8px',
              paddingRight: 10,
              borderRight: `3px solid ${C.brown}`,
            }}
          >
            💼 ما مدى توافرك للعمل؟
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 28,
            }}
          >
            {[
              ['free', 'أنا متفرغ بالفعل'],
              ['will', 'هتفرغ لو اتقبلت'],
              ['part', 'متاح Part-Time'],
            ].map(([v, l]) => (
              <RadioOption
                key={v}
                name="avail"
                value={v}
                label={l}
                checked={form.avail === v}
                onChange={(val) => update('avail', val)}
              />
            ))}
          </div>
          {errors.avail && (
            <p style={{ color: C.err, fontSize: 12, marginBottom: 14 }}>
              {errors.avail}
            </p>
          )}

          <Field label="خبراتك السابقة" icon="📝">
            <textarea
              placeholder="اكتب هنا خبراتك السابقة..."
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              style={{
                ...inputStyle,
                resize: 'none',
                lineHeight: 1.8,
                paddingTop: 12,
              }}
            />
          </Field>

          {netErr && (
            <p
              style={{
                color: C.err,
                fontSize: 13,
                margin: '10px 0',
                textAlign: 'center',
              }}
            >
              ⚠️ {netErr}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              marginTop: 24,
              background: loading
                ? 'rgba(37, 56, 84, 0.4)'
                : `linear-gradient(90deg, ${C.brownLight}, ${C.brown}, ${C.brownLight})`,
              color: C.white,
              border: 'none',
              borderRadius: 13,
              fontSize: 18,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: "'Cairo', sans-serif",
              boxShadow: '0 4px 20px rgba(37, 56, 84, 0.4)',
            }}
          >
            {loading ? '⏳ جاري الإرسال...' : 'سـجـل الآن'}
          </button>
        </div>
      </div>
    </>
  );
}
