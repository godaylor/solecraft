import { Link } from 'react-router-dom';

function Header(props) {
    return (
        <header className="d-flex justify-between align-center p-40">
            <Link to='/'> 
                <div className="d-flex align-center">
                    <div>
                        <h3 className="text-uppercase">Sneakers</h3>
                        <p className="opacity-5">Магазин кроссовок</p>
                    </div>
                </div>
            </Link>
            <ul className="hraderRight d-flex">
                <li onClick={props.onClickCart} className="mr-30 cu-p">
                    <img width={18} height={18} src="/img/cart.svg" alt="Cart" />
                    <span>1205 руб.</span>
                </li>
                <Link to='/favourites'>
                    <li className="mr-30 cu-p">
                        <img width={18} height={18} src="/img/heart-unliked.png" alt="Favourite" />
                    </li>
                </Link>
                <li>
                    <img width={18} height={18} src="/img/user.svg" alt="User" />
                </li>
            </ul>
        </header>
    );
}

export default Header;
