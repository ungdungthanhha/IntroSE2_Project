// src/services/authService.ts
import { getAuth, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore"; // Cần thêm để đọc dữ liệu user
import { app, db, COLLECTIONS } from "./firebase"; // Import config chuẩn

// Khởi tạo Auth
const auth = getAuth(app);

// --- HÀM ĐĂNG NHẬP (CHECK ROLE TỪ DB) ---
export const loginAdmin = async (email: string, pass: string): Promise<User> => {
  try {
    // 1. Bước 1: Xác thực Email/Pass với Firebase Auth
    // (Nếu sai mật khẩu, nó sẽ văng lỗi ngay tại dòng này)
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const user = userCredential.user;

    // 2. Bước 2: Kiểm tra Role trong Firestore
    // Truy cập vào bảng 'users' tìm document có ID trùng với UID người dùng
    const userRef = doc(db, COLLECTIONS.USERS, user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Trường hợp đăng nhập được nhưng không có dữ liệu trong bảng users
      await signOut(auth);
      throw new Error("Tài khoản này không tồn tại trong hệ thống dữ liệu!");
    }

    const userData = userSnap.data();

    // KIỂM TRA QUYỀN: Chỉ cho phép role là 'admin' (hoặc 'super_admin' nếu có)
    if (userData.role !== 'admin') {
      console.warn(`User ${user.email} cố gắng truy cập nhưng role là ${userData.role}`);

      // Đăng xuất ngay lập tức để bảo mật
      await signOut(auth);
      throw new Error("Bạn không có quyền truy cập trang Quản trị (Admin Only)!");
    }

    // 3. Bước 3: Đăng nhập thành công & Đúng quyền
    // Lưu vào localStorage để F5 không bị mất, nhưng sẽ xóa khi đóng browser
    localStorage.setItem('isAdmin', 'true');
    localStorage.setItem('adminEmail', user.email || "");

    return user;

  } catch (error: any) {
    console.error("Lỗi đăng nhập:", error.message);
    // Ném lỗi ra ngoài để Login.tsx bắt được và hiển thị thông báo đỏ
    throw error;
  }
};

// --- HÀM ĐĂNG XUẤT ---
export const logoutAdmin = async (): Promise<void> => {
  try {
    await signOut(auth);
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminEmail');
    window.location.href = "/login";
  } catch (error) {
    console.error("Lỗi đăng xuất:", error);
  }
};

// --- HÀM LẤY USER HIỆN TẠI ---
export const getCurrentAdmin = (): User | null => {
  return auth.currentUser;
};