import React from "react";
import { expect, test } from "@playwright/experimental-ct-react";
import { QrCode } from "./qr-code";

test("renders default QR code", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 200, height: 200 }}>
      <QrCode value="https://squonkstack.io" />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("renders QR code with label below", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 200, height: 240 }}>
      <QrCode
        value="https://squonkstack.io"
        label="https://squonkstack.io"
        labelPosition="below"
      />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("renders QR code with label above", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 200, height: 240 }}>
      <QrCode
        value="https://squonkstack.io"
        label="https://squonkstack.io"
        labelPosition="above"
      />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});

test("renders QR code with custom colours", async ({ mount }) => {
  const component = await mount(
    <div style={{ width: 200, height: 200 }}>
      <QrCode
        value="https://squonkstack.io"
        fgColor="#692BCC"
        bgColor="#F0EAFF"
      />
    </div>
  );
  await expect(await component.screenshot()).toMatchSnapshot();
});
