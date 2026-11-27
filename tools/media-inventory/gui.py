#!/usr/bin/env python3
"""Desktop GUI for the sound novel media inventory tool."""

from __future__ import annotations

import json
import queue
import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

import inventory


FILE_TYPES = [
    ("지원하는 게임 미디어", "*.sfc *.smc *.z64 *.v64 *.n64 *.gba *.cue *.bin *.iso *.img *.exe *.elf"),
    ("SFC ROM", "*.sfc *.smc"),
    ("Nintendo 64 ROM", "*.z64 *.v64 *.n64"),
    ("Game Boy Advance ROM", "*.gba"),
    ("PlayStation 디스크", "*.cue *.bin *.iso *.img"),
    ("모든 파일", "*.*"),
]


def default_output_path(inputs: list[Path]) -> Path:
    if len(inputs) == 1:
        return inputs[0].with_name(f"{inputs[0].stem}-inventory.json")
    return inputs[0].parent / "media-inventory.json"


def write_manifest(inputs: list[Path], output: Path, redact_names: bool) -> dict:
    manifest = inventory.build_manifest(inputs, redact_names)
    output.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


class InventoryApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("사운드노벨 미디어 조사 도구")
        self.geometry("720x500")
        self.minsize(620, 420)
        self.inputs: list[Path] = []
        self.events: queue.Queue[tuple[str, object]] = queue.Queue()
        self.redact_names = tk.BooleanVar(value=True)
        self.status = tk.StringVar(value="ROM, CUE 또는 ISO 파일을 선택하세요.")
        self._build_ui()
        self.after(100, self._poll_events)

    def _build_ui(self) -> None:
        outer = ttk.Frame(self, padding=18)
        outer.pack(fill="both", expand=True)

        ttk.Label(outer, text="로컬 게임 미디어 조사", font=("Segoe UI", 16, "bold")).pack(anchor="w")
        ttk.Label(
            outer,
            text="선택한 파일은 이 PC 안에서만 읽으며 네트워크로 전송하지 않습니다.",
        ).pack(anchor="w", pady=(4, 14))

        buttons = ttk.Frame(outer)
        buttons.pack(fill="x")
        self.select_button = ttk.Button(buttons, text="ROM·디스크 파일 선택", command=self._select_files)
        self.select_button.pack(side="left")
        self.clear_button = ttk.Button(buttons, text="목록 비우기", command=self._clear_files)
        self.clear_button.pack(side="left", padx=(8, 0))

        list_frame = ttk.Frame(outer)
        list_frame.pack(fill="both", expand=True, pady=12)
        self.file_list = tk.Listbox(list_frame, selectmode="extended", activestyle="none")
        scroll = ttk.Scrollbar(list_frame, orient="vertical", command=self.file_list.yview)
        self.file_list.configure(yscrollcommand=scroll.set)
        self.file_list.pack(side="left", fill="both", expand=True)
        scroll.pack(side="right", fill="y")

        ttk.Checkbutton(
            outer,
            text="공유용 JSON에서 원본 파일명 숨기기 (권장)",
            variable=self.redact_names,
        ).pack(anchor="w")

        self.progress = ttk.Progressbar(outer, mode="indeterminate")
        self.progress.pack(fill="x", pady=(12, 6))
        ttk.Label(outer, textvariable=self.status).pack(anchor="w")

        self.run_button = ttk.Button(outer, text="조사하고 JSON 저장", command=self._start_inventory, state="disabled")
        self.run_button.pack(anchor="e", pady=(12, 0))

    def _select_files(self) -> None:
        selected = filedialog.askopenfilenames(title="조사할 게임 미디어 선택", filetypes=FILE_TYPES)
        known = {path.resolve() for path in self.inputs}
        for value in selected:
            path = Path(value)
            if path.resolve() not in known:
                self.inputs.append(path)
                known.add(path.resolve())
                self.file_list.insert("end", path.name)
        self._update_ready_state()

    def _clear_files(self) -> None:
        self.inputs.clear()
        self.file_list.delete(0, "end")
        self._update_ready_state()

    def _update_ready_state(self) -> None:
        count = len(self.inputs)
        self.run_button.configure(state="normal" if count else "disabled")
        self.status.set(f"{count}개 파일 선택됨" if count else "ROM, CUE 또는 ISO 파일을 선택하세요.")

    def _set_busy(self, busy: bool) -> None:
        state = "disabled" if busy else "normal"
        self.select_button.configure(state=state)
        self.clear_button.configure(state=state)
        self.run_button.configure(state="disabled" if busy or not self.inputs else "normal")
        if busy:
            self.progress.start(12)
        else:
            self.progress.stop()

    def _start_inventory(self) -> None:
        suggested = default_output_path(self.inputs)
        output_value = filedialog.asksaveasfilename(
            title="조사 결과 JSON 저장",
            initialdir=str(suggested.parent),
            initialfile=suggested.name,
            defaultextension=".json",
            filetypes=[("JSON", "*.json")],
        )
        if not output_value:
            return
        output = Path(output_value)
        inputs = list(self.inputs)
        redact = self.redact_names.get()
        self._set_busy(True)
        self.status.set("파일을 읽고 SHA-256과 미디어 정보를 조사하는 중…")
        threading.Thread(target=self._worker, args=(inputs, output, redact), daemon=True).start()

    def _worker(self, inputs: list[Path], output: Path, redact: bool) -> None:
        try:
            manifest = write_manifest(inputs, output, redact)
        except Exception as exc:  # GUI boundary reports filesystem and parser errors.
            self.events.put(("error", exc))
        else:
            self.events.put(("done", (output, manifest)))

    def _poll_events(self) -> None:
        try:
            event, payload = self.events.get_nowait()
        except queue.Empty:
            self.after(100, self._poll_events)
            return
        self._set_busy(False)
        if event == "error":
            self.status.set("조사에 실패했습니다.")
            messagebox.showerror("조사 실패", str(payload))
        else:
            output, manifest = payload
            platforms = sorted({item["platform"] for item in manifest["inputs"]})
            self.status.set(f"완료: {output.name}")
            messagebox.showinfo(
                "조사 완료",
                f"{len(manifest['inputs'])}개 입력을 조사했습니다.\n"
                f"판별: {', '.join(platforms)}\n\n저장 위치:\n{output}",
            )
        self.after(100, self._poll_events)


def main() -> None:
    app = InventoryApp()
    app.mainloop()


if __name__ == "__main__":
    main()
