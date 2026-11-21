import { Link } from "react-router-dom";

const VANTAGENS = [
    { icone: "🧀", titulo: "Qualidade", texto: "Ingredientes selecionados e sabores para toda a família." },
    { icone: "❄️", titulo: "Congelado", texto: "Conserve no freezer e asse quando quiser." },
    { icone: "🚚", titulo: "Pedido fácil", texto: "Escolha os produtos, monte o carrinho e finalize." },
];

function App() {
    return (
        <section className="home">
            <div className="home-banner">
                <img src="/img/banner.png" alt="" />
                <div className="home-banner-texto">
                    <h1>Pão de queijo congelado</h1>
                    <p>Prático, saboroso e pronto para assar.</p>
                    <Link to="/produtos">Comprar agora</Link>
                </div>
            </div>
            <div className="home-vantagens">
                {VANTAGENS.map((item) => (
                    <article key={item.titulo}>
                        <h2><span aria-hidden="true">{item.icone}</span> {item.titulo}</h2>
                        <p>{item.texto}</p>
                    </article>
                ))}
            </div>
        </section>
    );
}

export default App;
