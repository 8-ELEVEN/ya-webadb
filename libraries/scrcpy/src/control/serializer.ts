import {
    type WritableStream,
    type WritableStreamDefaultWriter,
} from "@yume-chan/stream-extra";

import {
    type ScrcpyOptions,
    type ScrcpyOptionsInit1_16,
    type ScrcpyScrollController,
} from "../options/index.js";

import {
    ScrcpyInjectKeyCodeControlMessage,
    type AndroidKeyEventAction,
} from "./inject-keycode.js";
import { type ScrcpyInjectScrollControlMessage } from "./inject-scroll.js";
import { ScrcpyInjectTextControlMessage } from "./inject-text.js";
import { type ScrcpyInjectTouchControlMessage } from "./inject-touch.js";
import { ScrcpyRotateDeviceControlMessage } from "./rotate-device.js";
import {
    ScrcpySetScreenPowerModeControlMessage,
    type AndroidScreenPowerMode,
} from "./set-screen-power-mode.js";
import { ScrcpyControlMessageType } from "./type.js";

export class ScrcpyControlMessageSerializer {
    private options: ScrcpyOptions<ScrcpyOptionsInit1_16>;
    /** Control message type values for current version of server */
    private types: ScrcpyControlMessageType[];
    private writer: WritableStreamDefaultWriter<Uint8Array>;
    private scrollController: ScrcpyScrollController;

    public constructor(
        stream: WritableStream<Uint8Array>,
        options: ScrcpyOptions<ScrcpyOptionsInit1_16>
    ) {
        this.writer = stream.getWriter();

        this.options = options;
        this.types = options.getControlMessageTypes();
        this.scrollController = options.getScrollController();
    }

    public getActualMessageType(type: ScrcpyControlMessageType): number {
        const value = this.types.indexOf(type);
        if (value === -1) {
            throw new Error("Not supported");
        }
        return value;
    }

    public addMessageType<T extends { type: ScrcpyControlMessageType }>(
        message: Omit<T, "type">,
        type: T["type"]
    ): T {
        (message as T).type = this.getActualMessageType(type);
        return message as T;
    }

    public injectKeyCode(
        message: Omit<ScrcpyInjectKeyCodeControlMessage, "type">
    ) {
        return this.writer.write(
            ScrcpyInjectKeyCodeControlMessage.serialize(
                this.addMessageType(
                    message,
                    ScrcpyControlMessageType.InjectKeyCode
                )
            )
        );
    }

    public injectText(text: string) {
        return this.writer.write(
            ScrcpyInjectTextControlMessage.serialize({
                text,
                type: this.getActualMessageType(
                    ScrcpyControlMessageType.InjectText
                ),
            })
        );
    }

    /**
     * `pressure` is a float value between 0 and 1.
     */
    public injectTouch(message: Omit<ScrcpyInjectTouchControlMessage, "type">) {
        return this.writer.write(
            this.options.serializeInjectTouchControlMessage(
                this.addMessageType(
                    message,
                    ScrcpyControlMessageType.InjectTouch
                )
            )
        );
    }

    /**
     * `scrollX` and `scrollY` are float values between 0 and 1.
     */
    public injectScroll(
        message: Omit<ScrcpyInjectScrollControlMessage, "type">
    ) {
        const data = this.scrollController.serializeScrollMessage(
            this.addMessageType(message, ScrcpyControlMessageType.InjectScroll)
        );

        if (!data) {
            return;
        }

        return this.writer.write(data);
    }

    public async backOrScreenOn(action: AndroidKeyEventAction) {
        const buffer = this.options.serializeBackOrScreenOnControlMessage({
            action,
            type: this.getActualMessageType(
                ScrcpyControlMessageType.BackOrScreenOn
            ),
        });

        if (buffer) {
            return await this.writer.write(buffer);
        }
    }

    public setScreenPowerMode(mode: AndroidScreenPowerMode) {
        return this.writer.write(
            ScrcpySetScreenPowerModeControlMessage.serialize({
                mode,
                type: this.getActualMessageType(
                    ScrcpyControlMessageType.SetScreenPowerMode
                ),
            })
        );
    }

    public rotateDevice() {
        return this.writer.write(
            ScrcpyRotateDeviceControlMessage.serialize({
                type: this.getActualMessageType(
                    ScrcpyControlMessageType.RotateDevice
                ),
            })
        );
    }

    public close() {
        return this.writer.close();
    }
}
