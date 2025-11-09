// ✅ Supabase Client (بدون Import / بدون Module)
const supabase = window.supabase.createClient(
  "https://hdxnicjeamkwkuczcxov.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // ← ضع مفتاحك كاملا
);

// ✅ وظيفة تجريبية لجلب بيانات من جدول "users"
async function fetchUsers() {
    const outputElement = document.getElementById("output");
    outputElement.textContent = "جاري الجلب...";

    const { data, error } = await supabase
        .from("users")
        .select("*");

    if (error) {
        outputElement.textContent = "خطأ: " + error.message;
    } else {
        outputElement.textContent = JSON.stringify(data, null, 2);
    }
}
