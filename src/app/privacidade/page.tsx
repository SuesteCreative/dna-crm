export const dynamic = "force-dynamic";

export default function PrivacidadePage() {
    return (
        <div style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "48px 24px 80px",
            fontFamily: "Inter, sans-serif",
            color: "#1e293b",
            lineHeight: 1.7,
        }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: 4 }}>
                Política de Privacidade
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: 40 }}>
                Última actualização: Março 2026
            </p>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>1. Responsável pelo Tratamento</h2>
                <p>
                    <strong>Desportos Náuticos de Alvor (DNA)</strong><br />
                    Alvor, Portimão, Portugal<br />
                    Contacto: <a href="mailto:geral@desportosnauticosalvor.com" style={{ color: "#3b82f6" }}>geral@desportosnauticosalvor.com</a>
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>2. Que dados recolhemos</h2>
                <p>Quando utiliza o sistema de reservas online recolhemos:</p>
                <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                    <li><strong>Nome</strong> — para identificação da reserva</li>
                    <li><strong>Número de telefone</strong> (opcional) — para contacto em caso de necessidade</li>
                    <li><strong>Dados de pagamento</strong> — processados directamente pela Stripe; não armazenamos dados de cartão</li>
                    <li><strong>Dados de faturação</strong> (morada, NIF) — recolhidos pela Stripe para efeitos fiscais</li>
                </ul>
                <p style={{ marginTop: 12 }}>
                    Os dados recolhidos através do sistema de reservas interno (CRM) podem incluir adicionalmente endereço de e-mail, país e informações de actividade.
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>3. Finalidade e base legal</h2>
                <p>
                    Tratamos os seus dados com base no <strong>artigo 6.º, n.º 1, alínea b) do RGPD</strong> — execução de contrato —
                    para prestar o serviço de reserva de chapéu de sol/espreguiçadeira e gerir o pagamento associado.
                </p>
                <p style={{ marginTop: 8 }}>
                    Os dados não são utilizados para fins de marketing sem o seu consentimento explícito.
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>4. Partilha com terceiros</h2>
                <p>Os seus dados são partilhados com os seguintes prestadores de serviços, estritamente para os fins indicados:</p>
                <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                    <li><strong>Stripe</strong> — processamento seguro de pagamentos (stripe.com)</li>
                    <li><strong>Supabase / PostgreSQL</strong> — alojamento de base de dados seguro</li>
                    <li><strong>Vercel</strong> — alojamento da aplicação</li>
                    <li><strong>Google</strong> — sincronização de calendário interno de staff (Google Calendar)</li>
                    <li><strong>Shopify</strong> — sistema de reservas de actividades (jetski, passeios de barco, etc.)</li>
                    <li><strong>Resend</strong> — envio de e-mails transaccionais (confirmações de reserva)</li>
                </ul>
                <p style={{ marginTop: 12 }}>
                    Todos estes prestadores operam com medidas de segurança adequadas e estão sujeitos a contratos de processamento de dados em conformidade com o RGPD.
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>5. Período de conservação</h2>
                <p>
                    Os dados são conservados pelo período necessário à prestação do serviço e cumprimento de obrigações legais (nomeadamente fiscais),
                    não excedendo 7 anos, salvo obrigação legal em contrário.
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>6. Os seus direitos</h2>
                <p>Ao abrigo do RGPD, tem direito a:</p>
                <ul style={{ paddingLeft: 24, marginTop: 8 }}>
                    <li><strong>Acesso</strong> — saber que dados temos sobre si</li>
                    <li><strong>Rectificação</strong> — corrigir dados incorrectos</li>
                    <li><strong>Eliminação</strong> — solicitar a eliminação dos seus dados ("direito ao esquecimento")</li>
                    <li><strong>Portabilidade</strong> — receber os seus dados em formato estruturado</li>
                    <li><strong>Oposição</strong> — opor-se ao tratamento em determinadas circunstâncias</li>
                    <li><strong>Limitação</strong> — solicitar a limitação do tratamento</li>
                </ul>
                <p style={{ marginTop: 12 }}>
                    Para exercer qualquer destes direitos, contacte-nos por e-mail para{" "}
                    <a href="mailto:geral@desportosnauticosalvor.com" style={{ color: "#3b82f6" }}>
                        geral@desportosnauticosalvor.com
                    </a>. Responderemos no prazo de 30 dias.
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>7. Segurança</h2>
                <p>
                    Utilizamos medidas de segurança técnicas e organizacionais adequadas, incluindo autenticação segura (Clerk),
                    comunicações encriptadas (HTTPS/TLS), e controlo de acessos baseado em funções.
                    Os dados de pagamento nunca passam pelos nossos servidores — são processados directamente pela Stripe.
                </p>
            </section>

            <section style={{ marginBottom: 36 }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>8. Autoridade de controlo</h2>
                <p>
                    Tem o direito de apresentar uma reclamação junto da{" "}
                    <strong>Comissão Nacional de Protecção de Dados (CNPD)</strong>{" "}
                    em{" "}
                    <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>
                        www.cnpd.pt
                    </a>.
                </p>
            </section>

            <div style={{
                marginTop: 48,
                padding: "16px 20px",
                background: "#fef9c3",
                border: "1px solid #fde047",
                borderRadius: 8,
                fontSize: "0.82rem",
                color: "#713f12",
            }}>
                <strong>Nota:</strong> Este documento é um rascunho de boa-fé. Recomendamos a revisão por um advogado ou especialista em RGPD antes de o considerar definitivo.
            </div>

            <p style={{ marginTop: 40, fontSize: "0.8rem", color: "#94a3b8", textAlign: "center" }}>
                © Desportos Náuticos de Alvor · Desenvolvido por{" "}
                <a href="https://sueste-creative.pt/" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6" }}>
                    Sueste — Creative Agency
                </a>
            </p>
        </div>
    );
}
