sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "soprasteriacamera/control/Camera",
    "sap/m/Button",
    "sap/m/VBox",
  ],
  function (Controller, Camera, Button, VBox) {
    "use strict";

    return Controller.extend("soprasteriacamera.controller.Base", {
      onInit() {
        this.camera = this.byId("idCamera");
      },
      onTakeAPictureButtonPress() {
        console.log("activate camera button");
        this.camera.openCamera();
      },
    });
  }
);
