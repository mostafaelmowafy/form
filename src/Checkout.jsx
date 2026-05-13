import { useState } from 'react';
import toast from 'react-hot-toast';
import { MdLocalShipping } from 'react-icons/md';
import ReactPixel from 'react-facebook-pixel';
import { useNavigate } from 'react-router-dom';

export default function Checkout({ product, selectedOffer, packQuantity }) {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const convertArabicNumsToEnglish = (str) => {
    return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  };

  const validateForm = (formData) => {
    const newErrors = {};
    const phoneRegex =
      /^(?:(?:010|011|015)[0-9]{8}|(?:0127|0128|0120|0122|0121)[0-9]{7})$/;

    // 1. نسحب الرقم وننظفه من المسافات
    let rawPhone = (formData.get('phone') || '').trim();

    const phone = convertArabicNumsToEnglish(rawPhone);

    if (!formData.get('name')) newErrors.name = 'يجب إدخال الاسم بالكامل';

    if (!phone) {
      newErrors.phone = 'يجب إدخال رقم الهاتف';
    } else if (!phoneRegex.test(phone)) {
      newErrors.phone =
        '❌ من فضلك أدخل رقم هاتف صحيح يبدأ بـ 010 - 011 - 015 - 0127 - 0128 - 0120 - 0121 ويتكون من 11 رقم';
    }

    let rawOtherPhone = (formData.get('otherPhone') || '').trim();

    const otherPhone = convertArabicNumsToEnglish(rawOtherPhone);

    if (otherPhone && !phoneRegex.test(otherPhone)) {
      newErrors.otherPhone =
        '❌ من فضلك أدخل رقم هاتف بديل صحيح يبدأ بـ 010 - 011 - 015 - 0127 - 0128 - 0120 - 0121 ويتكون من 11 رقم';
    }

    if (!formData.get('governorate'))
      newErrors.governorate = 'يجب إدخال المحافظة';
    if (!formData.get('address'))
      newErrors.address = 'يجب إدخال العنوان بالتفصيل';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formElement = e.target;
    const formData = new FormData(formElement);
    const newErrors = validateForm(formData);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const orderData = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      otherPhone: formData.get('otherPhone') || 'لا يوجد',
      governorate: formData.get('governorate'),
      address: formData.get('address'),

      // هنا التعديل: إضافة packQuantity لتوضيح عدد المجموعات المطلوبة من هذا العرض
      products: `${product.name} | العرض: (${selectedOffer.label}) | الكمية المطلوبة: (${packQuantity} مجموعات)`,

      // حساب الإجمالي النهائي
      total: selectedOffer.price * packQuantity + ' EGP',
    };

    try {
      const scriptURL =
        'https://script.google.com/macros/s/AKfycbz3O34Jt_uvpa2y3AdwoYPvqZvJ7l-2AwKQwSFNzlD0AhZRyZ41lTY0rZwISIQnLV2Q/exec';

      // ملاحظة: أزلنا no-cors وأضفت تعامل مع الـ Redirect
      const response = await fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      // جوجل سكريبت غالباً بيعمل Redirect (كود 302)
      // لو الـ response.ok بـ true، يعني البيانات وصلت يقيناً
      if (response.ok || response.type === 'opaque') {
        // كود الفيس بوك بيكسل
        if (window.fbq) {
          ReactPixel.track('Purchase', {
            value: selectedOffer.price * packQuantity,
            currency: 'EGP',
            content_name: product.name,
          });

          navigate('/success', {
            state: { product, selectedOffer, packQuantity },
          });
        }

        formElement.reset();
      } else {
        throw new Error('السيرفر لم يستجب بشكل صحيح');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(
        '❌ فشل إرسال الطلب. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mx-auto p-4 lg:p-10 text-right font-cairo" dir="rtl">
      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-10"
      >
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-3 text-slate-700">
            لإجراء طلب، يرجى إدخال معلوماتك هنا:
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* الاسم */}
            <div className="col-span-2">
              <input
                name="name"
                type="text"
                placeholder="الاسم الكامل"
                className="w-full p-4 border rounded-xl outline-slate-600"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* الهاتف */}
            <div className="col-span-2">
              <input
                name="phone"
                type="tel"
                placeholder="رقم الهاتف (عليه واتساب للتأكيد)"
                className="w-full p-4 border rounded-xl outline-slate-600 text-right"
                maxLength={11}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* هاتف بديل */}
            <div className="col-span-2">
              <input
                name="otherPhone"
                type="tel"
                placeholder="رقم هاتف بديل (لسهولة التأكيد اختياري)"
                className="w-full p-4 border rounded-xl outline-slate-600 text-right"
                maxLength={11}
              />
              {errors.otherPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.otherPhone}</p>
              )}
            </div>

            {/* المحافظة - قائمة منسدلة */}
            <div className="col-span-2">
              <select
                name="governorate"
                className="w-full p-4 border rounded-xl outline-slate-600 bg-white appearance-none cursor-pointer bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-[left_1rem_center] bg-no-repeat"
                defaultValue=""
              >
                <option value="" disabled>
                  اختر المحافظة
                </option>
                {[
                  'القاهرة',
                  'الجيزة',
                  'الإسكندرية',
                  'الدقهلية',
                  'البحر الأحمر',
                  'البحيرة',
                  'الفيوم',
                  'الغربية',
                  'الإسماعيلية',
                  'المنوفية',
                  'المنيا',
                  'القليوبية',
                  'الوادي الجديد',
                  'السويس',
                  'الشرقية',
                  'أسوان',
                  'أسيوط',
                  'بني سويف',
                  'بورسعيد',
                  'دمياط',
                  'جنوب سيناء',
                  'كفر الشيخ',
                  'مطروح',
                  'قنا',
                  'شمال سيناء',
                  'سوهاج',
                  'الأقصر',
                ].map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
              {errors.governorate && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.governorate}
                </p>
              )}
            </div>

            {/* العنوان */}
            <div className="col-span-2">
              <input
                name="address"
                type="text"
                placeholder="العنوان بالتفصيل (منطقة - اسم الشارع - علامة مميزة - رقم العقار)"
                className="w-full p-4 border rounded-xl outline-slate-600"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h2 className="text-xl font-bold border-b pb-3 flex items-center gap-2 text-slate-700">
              <MdLocalShipping className="text-slate-600" /> مصاريف الشحن
            </h2>
            <p className="text-gray-600 mt-2 font-medium">
              الشحن مجاني لجميع المحافظات في مصر 🚚✨
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-5 text-white rounded-2xl font-black text-xl shadow-xl transition-all ${
              loading
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-slate-600 hover:bg-slate-700 active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                جاري معالجة الطلب...
              </span>
            ) : (
              'أطلب الآن - والدفع عند الاستلام'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
