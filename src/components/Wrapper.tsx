import React from "react";
import { HashRouter as Router, Route, Redirect } from "react-router-dom";
import SideBar from "./SideBar";
import Memo from "./Memo";
import Rest from "./Rest";
import "../style/style.css";

export default function Wrapper() {
  return (
    <section className='wrapper-div'>
      <Router>
        <SideBar />
        <Route path='/memo' exact component={Memo} />
        <Route path='/rest' component={Rest} />
        <Redirect to='/memo' />
      </Router>
    </section>
  );
}
