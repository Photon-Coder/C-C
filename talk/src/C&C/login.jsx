import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

import './style.css';
import Logo from './img/C&Clogo.png';

function Login() {

    const auth = getAuth();
    
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [errorFromSubmit, setErrorFromSubmit] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            await signInWithEmailAndPassword(auth, data.email, data.password);

            setLoading(false);
        } catch (error) {
            setErrorFromSubmit(error.message);
            setLoading(false);
            setTimeout(() => {
                setErrorFromSubmit("");
            }, 5000);
        }
    };

    return (
        <React.Fragment>
            <div className="L-body">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <Link className="logo" to="/Login">
                    <img src={Logo} alt="Logo" id="logo" />
                </Link>
                <div className="L-box">
                    <span className="L-borderLine"></span>
                    <form action="Login" method="post" onSubmit={handleSubmit(onSubmit)}>
                        <h2>Login</h2>
                        <div className="L-inputBox">
                            <input name="email" type="email" {...register("email", { required: true, pattern: /^\S+@\S+$/i })} />
                            <span>아이디</span>
                            <i></i>
                            {errors.email && <p>This email field is required</p>}
                        </div>
                        <div className="L-inputBox">
                            <input name="password" type="password" {...register("password", { required: true, minLength: 6 })} />
                            <span>비밀번호</span>
                            <i></i>
                            {errors.password && errors.password.type === "required" && <p>This password field is required</p>}
                            {errors.password && errors.password.type === "minLength" && <p>Password must have at least 6 characters</p>}

                            {errorFromSubmit && <p>{errorFromSubmit}</p>}
                        </div>
                        <div className="L-links">
                            <a href="#">아이디/비밀번호 찾기</a>
                            <Link to="/Registration">회원가입</Link>
                        </div>
                        <input type="submit" value="로그인" disabled={loading} />
                    </form>
                </div>
                <div id="no-mobile">
                    <span>화면이 너무 큽니다.</span>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Login;