import { useState, type FC } from "react";
import { ToastContainer } from "react-toastify";
import AppRoutes from "./AppRoutes";
import "react-toastify/dist/ReactToastify.css";

const Wrapper: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <section className='wrapper-div'>
        <AppRoutes isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </section>
      <ToastContainer />
    </>
  );
};

export default Wrapper;
