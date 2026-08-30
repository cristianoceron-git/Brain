#!/usr/bin/env python3
"""
FinanceFlow - Servidor Local de Desenvolvimento
Inicia um servidor HTTP local simples na porta 8000 para servir o Painel Financeiro.
"""

import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Desativa cache durante o desenvolvimento para recarregar arquivos instantaneamente
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    os.chdir(DIRECTORY)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("🚀 FinanceFlow - Painel de Controle Financeiro")
        print(f"📡 Servidor ativo em: http://localhost:{PORT}")
        print("📂 Diretório:", DIRECTORY)
        print("💡 Pressione Ctrl+C para encerrar o servidor.")
        print("=" * 60)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor finalizado com sucesso.")
            sys.exit(0)

if __name__ == '__main__':
    run()
