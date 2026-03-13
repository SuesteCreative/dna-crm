"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import "../../../../book.css";

export default function CancelPage() {
  const { slug, spotNumber } = useParams<{ slug: string; spotNumber: string }>();
  return (
    <div className="book-page">
      <div className={`book-header ${slug === "subnauta" ? "subnauta" : "tropico"}`} />
      <div className="book-result-card">
        <div className="book-result-icon">↩️</div>
        <div className="book-result-title">Pagamento cancelado</div>
        <div className="book-result-sub">
          Não foi efectuado nenhum pagamento. Pode tentar novamente.
          <br /><br />
          <em>No payment was taken. You can try again.</em>
        </div>
        <Link href={`/concessao/book/${slug}/${spotNumber}`} className="book-result-back">
          Voltar ao Chapéu
        </Link>
      </div>
    </div>
  );
}
