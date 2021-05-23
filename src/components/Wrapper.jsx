import React from "react";
import { HashRouter as Router, Route } from "react-router-dom";
import SideBar from "./SideBar";
import Memo from "./Memo";
import Rand from "./Rand";
import "../style/style.css";

export default function Wrapper() {
  return (
    <section className="wrapper-div">
      <Router>
        <SideBar />
        <Route path="/" exact component={Memo} />
        <Route path="/rand" component={Rand} />
      </Router>
    </section>
  );
}
