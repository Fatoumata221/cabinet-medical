#!/usr/bin/env python
# -*- coding: utf-8 -*-

import re
import os
import argparse
import textwrap

TAB_REGEX = re.compile(r"\{activeTab\s*===\s*['\"](\w+)['\"]\s*&&\s*\(")
STATE_MODAL_REGEX = re.compile(r"const\s*\[\s*(show\w+Modal)\s*,\s*\w+\s*\]\s*=\s*useState\(false\)")
HANDLER_DECL_REGEX = re.compile(r"const\s+(handle\w+)\s*=\s*\(\)\s*=>\s*\{", re.MULTILINE)
INLINE_HANDLER_REGEX = re.compile(r"on\w+\s*=\s*\{(?:async\s*)?\(\)\s*=>")
DIRECT_HANDLER_REGEX = re.compile(r"on\w+\s*=\s*\{([a-zA-Z0-9_]+)\}")
MODAL_JSX_REGEX = re.compile(r"\{(show\w+Modal)\s*&&\s*\(")
STATE_DECL_REGEX = re.compile(r"const\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\]\s*=\s*useState\((.*?)\)")

def find_state_declaration(lines, setter_name):
    """Cherche la déclaration useState correspondant à un setter"""
    full_text = "".join(lines)
    for match in STATE_DECL_REGEX.finditer(full_text):
        state_var, set_var, init_val = match.groups()
        if set_var == setter_name:
            # Retourne la ligne complète
            return match.group(0)
    return None

def read_file(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.readlines()

def extract_block(lines, start_index):
    """Extrait un bloc JSX ou handler complet"""
    block = []
    depth = 0
    started = False
    for i in range(start_index, len(lines)):
        line = lines[i]
        depth += line.count("{") + line.count("(")
        depth -= line.count("}") + line.count(")")
        block.append(line)
        if depth <= 0 and started:
            return block, i
        if ("{" in line or "(" in line) and not started:
            started = True
    return block, len(lines)-1

def find_handler_code(lines, handler_name):
    """Recherche le code d'un handler dans le fichier"""
    pattern = re.compile(rf"const\s+{re.escape(handler_name)}\s*=\s*\(\)\s*=>\s*\{{")
    for i, line in enumerate(lines):
        if pattern.search(line):
            block, _ = extract_block(lines, i)
            code = "".join(block)
            return textwrap.dedent(code)
    return None

def analyze_tabs(lines):
    tabs = []
    full_text = "".join(lines)

    for i, line in enumerate(lines):
        match = TAB_REGEX.search(line)
        if match:
            tab_name = match.group(1)
            jsx_block, end = extract_block(lines, i)
            content = "".join(jsx_block)

            # States modals
            states = set(STATE_MODAL_REGEX.findall(content))

            # Handlers déclarés
            handlers_decl = set(HANDLER_DECL_REGEX.findall(content))

            # Inline handlers (() => ...)
            inline_handlers = set()
            for m in INLINE_HANDLER_REGEX.finditer(content):
                inline_handlers.add("inline_handler")

            # Handlers utilisés directement (onClick={handleAddAppareil})
            direct_handlers = set(DIRECT_HANDLER_REGEX.findall(content))

            all_handlers = handlers_decl.union(direct_handlers).union(inline_handlers)

            # Cherche le code de chaque handler
            handlers_info = {}
            for h in all_handlers:
                if h != "inline_handler":
                    code = find_handler_code(lines, h)
                    if code:
                        handlers_info[h] = code
                    else:
                        handlers_info[h] = "Non trouvé / référence externe ou inline"
                else:
                    handlers_info[h] = "Inline (() => ...) défini directement dans JSX"

            # Modals JSX
            modals = set(MODAL_JSX_REGEX.findall(content))

            tabs.append({
                "name": tab_name,
                "start": i + 1,
                "end": end + 1,
                "states": states,
                "handlers": handlers_info,
                "modals": modals,
                "jsx": jsx_block
            })
    return tabs

def write_report(tabs, output):
    with open(output, "w", encoding="utf-8") as f:
        for tab in tabs:
            f.write(f"=== TAB : {tab['name']} ===\n")
            f.write(f"Lignes : {tab['start']} → {tab['end']}\n")
            f.write(f"States modals : {', '.join(tab['states']) or 'Aucun'}\n")
            f.write("Handlers :\n")
            if tab['handlers']:
                for h, code in tab['handlers'].items():
                    f.write(f"  - {h} :\n")
                    code_lines = code.splitlines()
                    for line in code_lines:
                        f.write(f"      {line}\n")
            else:
                f.write("  Aucun\n")
            f.write(f"Modals JSX : {', '.join(tab['modals']) or 'Aucun'}\n")
            f.write("Extractable : OUI\n")
            f.write("-" * 60 + "\n\n")

def generate_tab_component(tab, output_dir):
    name = tab["name"].capitalize() + "Tab"
    path = os.path.join(output_dir, f"{name}.jsx")
    jsx_content = textwrap.dedent("".join(tab["jsx"]))

    with open(path, "w", encoding="utf-8") as f:
        f.write("import React from 'react';\n\n")
        f.write(f"export default function {name}(props) {{\n")
        if tab["handlers"]:
            f.write(f"  // Handlers détectés : {', '.join(tab['handlers'].keys())}\n")
        if tab["states"]:
            f.write(f"  // States modals : {', '.join(tab['states'])}\n")
        f.write("  return (\n")
        for line in jsx_content.splitlines():
            f.write("    " + line + "\n")
        f.write("  );\n")
        f.write("}\n")

def generate_tab_component(tab, output_dir, file_lines):
    """
    Génère un composant React pour un tab avec :
    - Les handlers détectés et leur code
    - Les states utilisés par les handlers (recherche dans le fichier)
    
    tab : dictionnaire du tab
    output_dir : dossier où créer le fichier
    file_lines : toutes les lignes du fichier original pour rechercher les states
    """
    import os, textwrap, re

    name = tab["name"].capitalize() + "Tab"
    path = os.path.join(output_dir, f"{name}.jsx")
    jsx_content = textwrap.dedent("".join(tab["jsx"]))

    STATE_DECL_REGEX = re.compile(
        r"const\s*\[\s*([a-zA-Z0-9_]+)\s*,\s*([a-zA-Z0-9_]+)\s*\]\s*=\s*useState\((.*?)\)"
    )

    def setter_to_state(setter_name):
        """
        Transforme un setter React useState en nom de state correspondant.
        Exemple :
            setAppareilForm -> appareilForm
            setShowAppareilModal -> showAppareilModal
        """
        if not setter_name.startswith("set") or len(setter_name) <= 3:
            return setter_name
        state_name = setter_name[3:]
        return state_name[0].lower() + state_name[1:]

    def find_state_declaration(state_name):
        """
        Cherche la déclaration useState correspondant au nom de state
        """
        full_text = "".join(file_lines)
        for match in STATE_DECL_REGEX.finditer(full_text):
            state_var, set_var, init_val = match.groups()
            if state_var == state_name:
                return textwrap.indent(match.group(0), "  ")
        return None

    with open(path, "w", encoding="utf-8") as f:
        f.write("import React, { useState } from 'react';\n\n")
        f.write(f"export default function {name}(props) {{\n")

        # Garde une trace des states déjà injectés pour ne pas dupliquer
        injected_states = set()

        # Insère le code des handlers détectés
        if tab["handlers"]:
            f.write("  // Handlers détectés et injectés automatiquement\n")
            for h, code in tab["handlers"].items():
                if code.startswith("Non trouvé") or code.startswith("Inline"):
                    f.write(f"  // {h} : {code}\n")
                else:
                    # Cherche les setters utilisés dans le handler
                    setters = re.findall(r'set([A-Z][A-Za-z0-9_]*)\s*\(', code)
                    for setter in setters:
                        setter_full = "set" + setter  # on remet "set" pour matcher la déclaration
                        state_name = setter_to_state(setter_full)
                        if setter_full not in injected_states:
                            state_line = find_state_declaration(state_name)
                            if state_line:
                                f.write(f"{state_line}\n")
                            else:
                                f.write(f"  // WARNING: state pour '{state_name}' non trouvé dans le fichier\n")
                            injected_states.add(setter_full)

                    # Écrit le code du handler avec indentation
                    indented_code = textwrap.indent(code, "  ")
                    f.write(f"{indented_code}\n")

        # States modals détectés directement (optionnel)
        if tab["states"]:
            f.write(f"  // States modals : {', '.join(tab['states'])}\n")

        # JSX du composant
        f.write("  return (\n")
        for line in jsx_content.splitlines():
            f.write("    " + line + "\n")
        f.write("  );\n")
        f.write("}\n")

def main():
    parser = argparse.ArgumentParser(description="Extraction Tabs + Modals React avec code handlers")
    parser.add_argument("file", help="Fichier React (jsx / tsx)")
    parser.add_argument("-o", "--output", default="refactor_report.txt")
    parser.add_argument("-d", "--dir", default="extracted")
    parser.add_argument("-s", "--scan-only", action="store_true")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print("Fichier introuvable")
        return

    lines = read_file(args.file)
    tabs = analyze_tabs(lines)
    write_report(tabs, args.output)
    print(f"Rapport généré : {args.output}")

    if not args.scan_only:
        os.makedirs(args.dir, exist_ok=True)
        for tab in tabs:
            generate_tab_component(tab, args.dir, lines)
            if tab["modals"]:
                generate_modal_components(tab, args.dir)
        print(f"Composants générés dans : {args.dir}")

if __name__ == "__main__":
    main()
