import React, { lazy, useState, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SideBar from "./SideBar";
import ErrorBoundary from "./Memo/ErrorBoundary";
import Loading from "./Common/loading";

const Memo = lazy(() => import("./Memo"));
const Rest = lazy(() => import("./Rest"));

export default function Wrapper() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className='wrapper-div'>
      <BrowserRouter>
        <SideBar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className='fade-in'>
                <Loading spinning={true} />
              </div>
            }>
            <Routes>
              <Route path='/' element={<Memo />} />
              <Route path='/memo' element={<Memo />} />
              <Route path='/rest' element={<Rest />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </section>
  );
}
