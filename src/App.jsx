import { BrowserRouter } from "react-router-dom";
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppRouter from "./router";

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
      
      {/* Toast thông báo toàn cục */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnHover={false}
        theme="light"
        transition={Slide}
      />
    </BrowserRouter>
  );
}

export default App;