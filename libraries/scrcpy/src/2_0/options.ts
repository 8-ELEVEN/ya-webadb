import type { MaybePromiseLike } from "@yume-chan/async";
import type { ReadableStream, TransformStream } from "@yume-chan/stream-extra";

import type {
    ScrcpyAudioStreamMetadata,
    ScrcpyControlMessageType,
    ScrcpyDisplay,
    ScrcpyEncoder,
    ScrcpyMediaStreamPacket,
    ScrcpyOptions,
    ScrcpyOptionsListEncoders,
    ScrcpyScrollController,
    ScrcpyVideoStream,
} from "../base/index.js";
import { ScrcpyDeviceMessageParsers } from "../base/index.js";
import type {
    ScrcpyBackOrScreenOnControlMessage,
    ScrcpyInjectTouchControlMessage,
    ScrcpySetClipboardControlMessage,
} from "../latest.js";

import type { Init } from "./impl/index.js";
import {
    AckClipboardHandler,
    ClipboardStream,
    ControlMessageTypes,
    createMediaStreamTransformer,
    createScrollController,
    Defaults,
    parseAudioStreamMetadata,
    parseDisplay,
    parseEncoder,
    parseVideoStreamMetadata,
    serialize,
    serializeBackOrScreenOnControlMessage,
    serializeInjectTouchControlMessage,
    setListDisplays,
    setListEncoders,
} from "./impl/index.js";

export class ScrcpyOptions2_0
    implements ScrcpyOptions<Init>, ScrcpyOptionsListEncoders
{
    static readonly Defaults = Defaults;

    readonly value: Required<Init>;

    get controlMessageTypes(): readonly ScrcpyControlMessageType[] {
        return ControlMessageTypes;
    }

    #clipboard: ClipboardStream | undefined;
    get clipboard(): ReadableStream<string> | undefined {
        return this.#clipboard;
    }

    #ackClipboardHandler: AckClipboardHandler | undefined;

    #deviceMessageParsers = new ScrcpyDeviceMessageParsers();
    get deviceMessageParsers() {
        return this.#deviceMessageParsers;
    }

    constructor(init: Init) {
        this.value = { ...Defaults, ...init };

        if (this.value.control && this.value.clipboardAutosync) {
            this.#clipboard = this.#deviceMessageParsers.add(
                new ClipboardStream(),
            );

            this.#ackClipboardHandler = this.#deviceMessageParsers.add(
                new AckClipboardHandler(),
            );
        }
    }

    serialize(): string[] {
        return serialize(this.value, Defaults);
    }

    setListDisplays(): void {
        setListDisplays(this.value);
    }

    parseDisplay(line: string): ScrcpyDisplay | undefined {
        return parseDisplay(line);
    }

    setListEncoders() {
        setListEncoders(this.value);
    }

    parseEncoder(line: string): ScrcpyEncoder | undefined {
        return parseEncoder(line);
    }

    parseVideoStreamMetadata(
        stream: ReadableStream<Uint8Array>,
    ): MaybePromiseLike<ScrcpyVideoStream> {
        return parseVideoStreamMetadata(this.value, stream);
    }

    parseAudioStreamMetadata(
        stream: ReadableStream<Uint8Array>,
    ): MaybePromiseLike<ScrcpyAudioStreamMetadata> {
        return parseAudioStreamMetadata(stream, this.value);
    }

    createMediaStreamTransformer(): TransformStream<
        Uint8Array,
        ScrcpyMediaStreamPacket
    > {
        return createMediaStreamTransformer(this.value);
    }

    serializeInjectTouchControlMessage(
        message: ScrcpyInjectTouchControlMessage,
    ): Uint8Array {
        return serializeInjectTouchControlMessage(message);
    }

    serializeBackOrScreenOnControlMessage(
        message: ScrcpyBackOrScreenOnControlMessage,
    ): Uint8Array | undefined {
        return serializeBackOrScreenOnControlMessage(message);
    }

    serializeSetClipboardControlMessage(
        message: ScrcpySetClipboardControlMessage,
    ): Uint8Array | [Uint8Array, Promise<void>] {
        return this.#ackClipboardHandler!.serializeSetClipboardControlMessage(
            message,
        );
    }

    createScrollController(): ScrcpyScrollController {
        return createScrollController();
    }
}

type Init_ = Init;

export namespace ScrcpyOptions2_0 {
    export type Init = Init_;
}
