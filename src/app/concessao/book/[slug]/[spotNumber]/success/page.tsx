"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import "../../../book.css";

export default function SuccessPage() {
  const { slug, spotNumber } = useParams<{ slug: string; spotNumber: string }>();
  return (
    <div className="book-page">
      <div className={`book-header ${slug === "subnauta" ? "subnauta" : "tropico"}`} />
      <div className="book-result-card">
        <div className="book-result-icon">✅</div>
        <div className="book-result-title">Pagamento confirmado!</div>
        <div className="book-result-sub">
          O seu chapéu {spotNumber} está reservado. Pode acomodar-se — o staff foi notificado.
          <br /><br />
          <em>Payment confirmed. Your seat {spotNumber} is reserved.</em>
        </div>
        <Link href={`/concessao/book/${slug}/${spotNumber}`} className="book-result-back">
          Voltar ao Chapéu
        </Link>
      </div>
    </div>
  );
}
