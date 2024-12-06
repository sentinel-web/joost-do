import React from "react";
import { createRoot } from "react-dom/client";
import { Meteor } from "meteor/meteor";
import Root from "../imports/ui/Root";

Meteor.startup(() => {
  document.documentElement.lang = "en";
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
  const container = document.getElementById("react-target");
  const root = createRoot(container);
  root.render(<Root />);
});
