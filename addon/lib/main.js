const widgets = require("widget");
const data = require("self").data;
const tabs = require("tabs");
const { StartupPanel } = require("./startup-panel");
const { Page } = require("page-worker");
const simplePrefs = require('simple-prefs');

var button = widgets.Widget({
  id: "towtruck-starter",
  label: "Start TowTruck",
  contentURL: data.url("button.html"),
  contentScriptFile: data.url("button.js"),
  onClick: startTowTruck,
  width: 48
});

StartupPanel({
  name: "TowTruck",
  contentURL: data.url("startup-help.html")
});

function startTowTruck() {
  console.log("clicked!");
  var tab = tabs.activeTab;
  if (tab.towtruckCloser) {
    tab.towtruckCloser();
    return;
  }
  tab.towtruckCloser = function () {
    tab.towtruckCloser = null;
    button.port.emit("TowTruckOff");
    tab.removeListener("ready", attachWorker);
  };
  var worker;
  function attachWorker() {
    worker = tab.attach({
      contentScriptFile: [
        data.url("attachment.js")
      ]
    });
    worker.port.on("Close", function () {
      tab.towtruckCloser();
    });
    worker.port.emit("Config", {url: simplePrefs.prefs.towtruckJs});
  }
  button.port.emit("TowTruckOn");
  tab.on("ready", attachWorker);
  attachWorker();
}
// Need poll for back button code

tabs.on("activate", function () {
  if (tabs.activeTab.towtruckCloser) {
    button.port.emit("TowTruckOn");
  } else {
    button.port.emit("TowTruckOff");
  }
});
