import React from "react";
import styles from "./Card.module.scss";

function Card({
  imageUrl,
  title,
  price,
  onFavorite,
  onPlus,
  favourited = false,
}) {
  const [isAdded, setIsAdded] = React.useState(false);
  const [isFavourite, setIsFavourite] = React.useState(favourited);

  const onClickPlus = () => {
    onPlus({ imageUrl, title, price });
    setIsAdded(!isAdded);
  };

  const onClickFavourite = () => {
    onFavorite({ imageUrl, title, price });
    setIsFavourite(!isFavourite);
  };

  return (
    <div className={styles.card}>
      <button className={styles.favourite}>
        <img
          onClick={onClickFavourite}
          src={isFavourite ? "/img/heart-liked.png" : "/img/heart-unliked.png"}
          alt="Unliked"
        />
      </button>
      <img width={133} height={112} src={imageUrl} alt="Sneakers" />
      <h5>{title}</h5>
      <div className="d-flex justify-between align-center">
        <div className="d-flex flex-column">
          <span>Цена:</span>
          <b>{price} руб.</b>
        </div>
        <button>
          <img
            className={styles}
            onClick={onClickPlus}
            src={isAdded ? "/img/btn-checked.svg" : "/img/btn-plus.png"}
            alt="Plus"
          />
        </button>
      </div>
    </div>
  );
}

export default Card;
