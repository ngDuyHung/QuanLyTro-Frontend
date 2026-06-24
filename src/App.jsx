import { BrowserRouter } from "react-router-dom";
import { ToastContainer, Bounce } from "react-toastify"; // Thay Slide bằng Bounce
import "react-toastify/dist/ReactToastify.css";
import "./assets/css/toast-custom.css";
import AppRouter from "./router";

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      
      <ToastContainer
        position="top-right"
        autoClose={5000} // Tăng lên 5 giây cho người lớn tuổi dễ đọc
        hideProgressBar={false} // BẬT LẠI thanh chạy để tạo cảm giác kiểm soát thời gian
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover={true} // Giữ thông báo khi đưa chuột vào
        theme="light"
        transition={Bounce} // Hiệu ứng nảy nhẹ, gây chú ý tốt hơn
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
      />
    </BrowserRouter>
  );
}

export default App;