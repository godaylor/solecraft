import { Link } from "react-router-dom";
import Card from "../components/Card";

function Favourites({ onRemove, items = [], onAddToFavourite }) {
  return (
    <div className="favourites">
      <h2 className="d-flex justify-between mb-30">
        Желаемые товары
        <Link to="/">
          <img
            className="cu-p"
            src="/img/btn-remove.svg"
            alt="Close Favourite"
          />
        </Link>
      </h2>

      {items.length <= 0 ? (
        <div class="cartEmpty d-flex align-center justify-center flex-column flex">
          <h2>Нет желаний</h2>
          <p class="opacity-6">Сюда можно добавлять кроссовки</p>
          <Link to="/">
            <button class="greenButton">
              <img src="/img/arrow.svg" alt="Arrow" />
              Вернуться назад
            </button>
          </Link>
        </div>
      ) : (
        <div className="items d-flex align-center justify-center">
          {items.map((item) => (
            <div className="d-flex">
              <Card
                key={item.imageUrl}
                title={item.title}
                price={item.price}
                imageUrl={item.imageUrl}
                favourited={true}
                onFavourite={onAddToFavourite}
              />
              <img
                onClick={() => onRemove(item.id)}
                className="removeBtn"
                src="/img/btn-remove.svg"
                alt="Remove"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favourites;
