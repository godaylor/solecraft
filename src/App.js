import React, { useState } from "react";
import axios from "axios";
import Header from "./components/Header";
import Overlay from "./components/Overlay";
import Favourites from "./pages/Favourites";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

function App() {
  const [items, setItems] = React.useState([]);
  const [cartItems, setCartItems] = React.useState([]);
  const [favouriteItems, setFavouriteItems] = React.useState([]);
  const [cartOpened, setCartOpened] = React.useState(false);
  const [searchValue, setSearchValue] = useState("");

  React.useEffect(() => {
    // fetch("https://640a1e9ad16b1f3ed6e72dd6.mockapi.io/items")
    //   .then((res) => {
    //     return res.json()
    //   })
    //   .then((json) => {
    //     setItems(json)
    //   })

    axios
      .get("https://640a1e9ad16b1f3ed6e72dd6.mockapi.io/items")
      .then((res) => {
        setItems(res.data);
      });
    axios
      .get("https://640a1e9ad16b1f3ed6e72dd6.mockapi.io/cart")
      .then((res) => {
        setCartItems(res.data);
      });
  }, []);

  const onAddToCart = (obj) => {
    axios.post("https://640a1e9ad16b1f3ed6e72dd6.mockapi.io/cart", obj);
    setCartItems((prev) => [...prev, obj]);
  };

  const onAddToFavourite = (obj, id) => {
    // if (favouriteItems.find(obj => obj.id === id)){
    //   axios.delete(`/cart/${id}`)
    //   setFavouriteItems((prev) => prev.filter((item) => item.id !== id))
    // } else {}
    setFavouriteItems((prev) => [...prev, obj]);
  };

  const onRemoveItem = (id) => {
    axios.delete(`https://640a1e9ad16b1f3ed6e72dd6.mockapi.io/cart/${id}`);
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const onRemoveFavourite = (id) => {
    setFavouriteItems((prev) => prev.filter((item) => item.id !== id));
  };

  const onChangeSearchInput = (event) => {
    setSearchValue(event.target.value);
  };

  return (
    <div className="wrapper clear">
      {cartOpened && (
        <Overlay
          items={cartItems}
          onClose={() => setCartOpened(false)}
          onRemove={onRemoveItem}
        />
      )}

      <Header onClickCart={() => setCartOpened(true)} />

      <Routes>
        <Route path="/" />
        <Route
          path="/favourites"
          element={
            <Favourites
              items={favouriteItems}
              onRemove={onRemoveFavourite}
              onAddToFavourite={onAddToFavourite}
            />
          }
        />
      </Routes>

      <Home
        items={items}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        onChangeSearchInput={onChangeSearchInput}
        onAddToFavourite={onAddToFavourite}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}

export default App;
