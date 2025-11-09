// Supabase Client
const supabase = window.supabase.createClient(
  "https://hdxnicjeamkwkuczcxov.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ..."
);

const table = "messages"; // اسم الجدول

// === صفحة العرض ===
async function loadMessage() {
  const { data, error } = await supabase
    .from(table)
    .select("text")
    .eq("id", 1)
    .single();

  if (data) document.getElementById("msg").textContent = data.text;
}
if (document.getElementById("msg")) loadMessage();

// Real-time sync
supabase
  .channel("messages-changes")
  .on("postgres_changes", { event: "*", schema: "public", table }, payload => {
    if (document.getElementById("msg"))
      document.getElementById("msg").textContent = payload.new.text;
  })
  .subscribe();

// === لوحة التحكم ===
async function updateMsg() {
  const text = document.getElementById("newMsg").value;
  const { error } = await supabase
    .from(table)
    .update({ text })
    .eq("id", 1);

  document.getElementById("status").textContent = error
    ? "فشل الحفظ!"
    : "✅ تم التحديث وتزامن للجميع";
}

function openAdmin() {
  const pass = prompt("ادخل كلمة المرور:");

  // ضع كلمة المرور التي تريدها
  if (pass === "1234") {
    // فتح لوحة التحكم
    window.location.href = "admin.html";
  } else {
    alert("❌ كلمة المرور غير صحيحة");
  }
}
