import styles from './header.module.css';
import reactLogo from '../../assets/react.svg';
export const Header = () => {

    return (
        <div className={styles.container}>
            <div className={styles.titleContainer}>
                <img scr={reactLogo} alt="logo" width={50} height={50} />
            </div>
            <div>
                <h1>
                    To do list
                </h1>
                <div className="color-gray">
                    <code>
                        Eleminez le chaos, suivez le flux
                    </code>
                </div>
            </div>
            <code className="color-primary">
                v.1.0
            </code>
        </div>
    )

};