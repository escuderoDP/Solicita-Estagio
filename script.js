// Aguarda o DOM carregar completamente
document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do formulário (código igual ao anterior)
    const nomeInput = document.getElementById('nome');
    const sexoSelect = document.getElementById('sexo');
    const matriculaInput = document.getElementById('matricula');
    const cursoSelect = document.getElementById('curso');
    const empresaInput = document.getElementById('empresa');
    const downloadBtn = document.getElementById('downloadBtn');
    const form = document.getElementById('declarationForm');

    // --- Lógica para Habilitar/Desabilitar Campos (código igual ao anterior) ---
    function updateFieldState() {
        const nomeValido = nomeInput.value.trim().length >= 4;
        const sexoValido = sexoSelect.value !== "";
        const matriculaValida = /^\d{13}$/.test(matriculaInput.value);
        const cursoValido = cursoSelect.value !== "";
        const empresaValida = empresaInput.value.trim().length > 0;

        sexoSelect.disabled = !nomeValido;
        sexoSelect.setAttribute('aria-disabled', String(!nomeValido));

        matriculaInput.disabled = !(nomeValido && sexoValido);
        matriculaInput.setAttribute('aria-disabled', String(!(nomeValido && sexoValido)));

        cursoSelect.disabled = !(nomeValido && sexoValido && matriculaValida);
        cursoSelect.setAttribute('aria-disabled', String(!(nomeValido && sexoValido && matriculaValida)));

        empresaInput.disabled = !(nomeValido && sexoValido && matriculaValida && cursoValido);
        empresaInput.setAttribute('aria-disabled', String(!(nomeValido && sexoValido && matriculaValida && cursoValido)));

        downloadBtn.disabled = !(nomeValido && sexoValido && matriculaValida && cursoValido && empresaValida);
        downloadBtn.setAttribute('aria-disabled', String(!(nomeValido && sexoValido && matriculaValida && cursoValido && empresaValida)));
    }

    nomeInput.addEventListener('input', updateFieldState);
    sexoSelect.addEventListener('change', updateFieldState);
    matriculaInput.addEventListener('input', () => {
        matriculaInput.value = matriculaInput.value.replace(/\D/g, '');
        updateFieldState();
    });
    cursoSelect.addEventListener('change', updateFieldState);
    empresaInput.addEventListener('input', updateFieldState);

    updateFieldState(); // Estado inicial

    // --- Função para carregar a imagem como Data URL (código igual ao anterior) ---
    async function loadImageAsDataURL(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro HTTP! status: ${response.status}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Erro ao carregar a imagem:", error);
            throw error;
        }
    }

    // --- Lógica para Gerar PDF com Formatação ABNT e Novos Alinhamentos ---
    downloadBtn.addEventListener('click', async () => {
        if (downloadBtn.disabled) {
            console.error("Tentativa de download com formulário inválido.");
            return;
        }

        downloadBtn.textContent = 'Gerando...';
        downloadBtn.disabled = true;

        try {
            const logoDataURL = await loadImageAsDataURL('logo.png');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const FONT_FAMILY = 'arial';
            const FONT_SIZE_BODY = 12;
            const LINE_SPACING = 1.5;
            const MARGIN_TOP = 30;
            const MARGIN_LEFT = 30;
            const MARGIN_BOTTOM = 20;
            const MARGIN_RIGHT = 20;
            const PARAGRAPH_INDENT = 12.5;

            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const contentWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT;
            let currentY = MARGIN_TOP;

            try {
                doc.setFont(FONT_FAMILY, 'normal');
            } catch (e) {
                console.warn("Fonte 'arial' não encontrada, usando 'helvetica'.");
                doc.setFont('helvetica', 'normal');
            }
            doc.setFontSize(FONT_SIZE_BODY);
            doc.setTextColor(0, 0, 0);

            // Logo
            const imgProps = doc.getImageProperties(logoDataURL);
            const pdfLogoWidth = Math.min(60, contentWidth);
            const pdfLogoHeight = (imgProps.height * pdfLogoWidth) / imgProps.width;
            const logoX = (pageWidth - pdfLogoWidth) / 2;
            const logoY = MARGIN_TOP;
            doc.addImage(logoDataURL, 'PNG', logoX, logoY, pdfLogoWidth, pdfLogoHeight);
            currentY = logoY + pdfLogoHeight + 10;

            // Título
            doc.setFont(undefined, 'bold');
            doc.setFontSize(14);
            doc.text('SOLICITAÇÃO DE VAGA DE ESTÁGIO', pageWidth / 2, currentY, { align: 'center' });
            currentY += 15;
            doc.setFont(undefined, 'normal');
            doc.setFontSize(FONT_SIZE_BODY);

            // Corpo
            const nomeAluno = nomeInput.value.trim();
            const sexo = sexoSelect.value;
            const matricula = matriculaInput.value;
            const curso = cursoSelect.value;
            const nomeEmpresa = empresaInput.value.trim();

            const artigo = sexo === 'Masculino' ? 'o' : 'a';
            const terminacao = sexo === 'Masculino' ? 'o' : 'a';
            const artigoRef = sexo === 'Masculino' ? 'O' : 'A';
            const refTerm = sexo === 'Masculino' ? 'o' : 'a';

            const textoDeclaracao = `Declaramos, para os devidos fins, que ${artigo} alun${terminacao} ${nomeAluno} está regularmente matriculad${terminacao} n${artigo} ${curso} deste Instituto Federal de Educação, Ciência e Tecnologia de Rondônia – Campus Jaru, sob matrícula número ${matricula}.\n\n${artigoRef} referid${refTerm} alun${terminacao} manifesta interesse em realizar estágio na empresa e solicita uma vaga na ${nomeEmpresa}, como parte de sua formação acadêmica e profissional.\n\nSolicitamos, cordialmente, a gentileza da empresa em considerar esta solicitação.`;

            const paragraphs = textoDeclaracao.split('\n\n');

            paragraphs.forEach(paragraph => {
                if (currentY + 10 > pageHeight - MARGIN_BOTTOM) {
                    doc.addPage();
                    currentY = MARGIN_TOP;
                }

                const indent = ' '.repeat(5); // Simula indentação com espaço
                const fullParagraph = indent + paragraph;

                const paragraphLines = doc.splitTextToSize(fullParagraph, contentWidth);
                const paragraphText = paragraphLines.join('\n');
                const lineHeight = FONT_SIZE_BODY * LINE_SPACING;

                doc.text(paragraphText, MARGIN_LEFT, currentY, {
                    maxWidth: contentWidth,
                    align: 'justify'
                });

                currentY += lineHeight;
            });

            // Data
            currentY += 20;
            if (currentY + 30 > pageHeight - MARGIN_BOTTOM) {
                doc.addPage();
                currentY = MARGIN_TOP;
            }
            const today = new Date();
            const dia = String(today.getDate()).padStart(2, '0');
            const mes = today.toLocaleString('pt-BR', { month: 'long' });
            const ano = today.getFullYear();
            const dataFormatada = `Jaru – RO, ${dia} de ${mes} de ${ano}.`;
            doc.text(dataFormatada, MARGIN_LEFT + contentWidth, currentY, { align: 'right' });
            currentY += 25;

            // Assinatura
            if (currentY + 20 > pageHeight - MARGIN_BOTTOM) {
                doc.addPage();
                currentY = MARGIN_TOP;
            }
            const signatureLine = '_________________________________________';
            const signatureText = 'Coordenação de Integração Escola, Empresa e Comunidade (CIEEC)';
            const institutionText = 'Instituto Federal de Rondônia – Campus Jaru';

            doc.setFontSize(FONT_SIZE_BODY);
            doc.text(signatureLine, pageWidth / 2, currentY, { align: 'center' });
            currentY += 6;
            doc.setFontSize(10);
            doc.text(signatureText, pageWidth / 2, currentY, { align: 'center' });
            currentY += 5;
            doc.setFontSize(11);
            doc.text(institutionText, pageWidth / 2, currentY, { align: 'center' });

            const safeName = nomeAluno.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
            doc.save(`Declaracao_Estagio_${safeName}_${matricula}_ABNT_v2.pdf`);

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Ocorreu um erro ao gerar o PDF. Verifique se a imagem da logo está acessível e tente novamente.\nDetalhes: " + error.message);
        } finally {
            downloadBtn.textContent = 'Baixar Declaração';
            updateFieldState();
        }
    });

}); // Fim do DOMContentLoaded
