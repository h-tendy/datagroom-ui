import React from "react";
import ReactDOM from "react-dom";
import Root from "./common/components/Root";
import { store } from './common/helpers';
import "./index.css";

ReactDOM.render(
    <Root store={store} />,
    document.getElementById("root")
);
