// إعدادات الموقع — ضع هنا رابط «تطبيق الويب» من Google Apps Script (انظر README.md)
window.QAIDA_CONFIG = {
  backendUrl: "https://script.google.com/macros/s/AKfycbzwMPe43C2u080BE5T3lydrWebRpfbiKPuAPWM1a88PWKWdDy3AvEJlKRedOZkwZvqh/exec",
  // الشهادة: اترك أي خانة فارغة إن لم تحتجها
  certificate: {
    org: "",                 // اسم الجهة، مثل: "مركز رياض الجنة لتحفيظ القرآن"
    orgLogo: "",             // صورة شعار الجهة، مثل: "icons/org-logo.png" (ضعها في مجلد icons)
    intro: "",               // جملة البداية بدل «تشهد رحلة الحروف بأنّ الطالب/ـة»
    director: "",            // اسم المدير (يظهر توقيعه بخط الرقعة)
    directorTitle: "المدير", // صفته تحت التوقيع، مثل: "مدير المركز"
    directorSignature: "",   // صورة توقيع حقيقي للمدير (اختياري)، مثل: "icons/sign-director.png"
    teacherSignature: ""     // صورة توقيع موحّد للمعلمين (اختياري)
  }
};
