import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import md5 from 'md5';
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import './style.css';
import Logo from './img/C&Clogo.png';

function Registration() {
    const { register, watch, formState: { errors }, handleSubmit } = useForm();
    const [errorFromSubmit, setErrorFromSubmit] = useState("");
    const [loading, setLoading] = useState(false);

    const password = useRef();
    password.current = watch("password");

    const [isTeamSelectDisabled, setIsTeamSelectDisabled] = useState(true);
    const [showCompanyFields, setShowCompanyFields] = useState(false);
    const [showPhoneField, setShowPhoneField] = useState(true);

    const handleCompanyNumberChange = (event) => {
        const companyNumber = event.target.value;
        if (companyNumber !== "") {
            setIsTeamSelectDisabled(false);
            setShowCompanyFields(true);
        } else {
            setIsTeamSelectDisabled(true);
            setShowCompanyFields(false);
        }
    };

    const handleNextClick = () => {
        setShowPhoneField(false);
    };

    const onSubmit = async (data) => {
        console.log('data', data);
        try {
            setLoading(true);

            const auth = getAuth();
            let createdUser = await createUserWithEmailAndPassword(auth, data.email, data.password);

            await updateProfile(auth.currentUser, {
                displayName: data.name,
                photoURL: `http://gravatar.com/avatar/${md5(createdUser.user.email)}?d=identicon`
            });

            // Firebase 데이터베이스에 저장해주기
            set(ref(getDatabase(), `users/${createdUser.user.uid}`), {
                name: createdUser.user.displayName,
                image: createdUser.user.photoURL
            });

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
            <div className="R-body">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <Link className="logo" to="/Login">
                    <img src={Logo} alt="Logo" id="logo" />
                </Link>
                <div className="R-box">
                    <span className="R-borderLine"></span>
                    <form action="Registration" method="post" onSubmit={handleSubmit(onSubmit)}>
                        <h2>Registration</h2>
                        {showPhoneField && (
                            <div>
                                <div className="R-inputBox">
                                    <input name="email" type="email" {...register("email", { required: true, pattern: /^\S+@\S+$/i })} />
                                    <span>아이디</span>
                                    <i></i>
                                    {errors.email && <p>This email field is required</p>}
                                </div>
                                <div className="R-inputBox">
                                    <input name="password" type="password" {...register("password", { required: true, minLength: 6 })} />
                                    <span>비밀 번호</span>
                                    <i></i>
                                    {errors.password && errors.password.type === "required" && <p>This password field is required</p>}
                                    {errors.password && errors.password.type === "minLength" && <p>Password must have at least 6 characters</p>}
                                </div>
                                <div className="R-inputBox">
                                    <input name="password_confirm" type="password" {...register("password_confirm", { required: true, validate: (value) => value === password.current })} />
                                    <span>비밀 번호 확인</span>
                                    <i></i>
                                    {errors.password_confirm && errors.password_confirm.type === "required" && <p>This password confirm field is required</p>}
                                    {errors.password_confirm && errors.password_confirm.type === "validate" && <p>The passwords do not match</p>}
                                    {errorFromSubmit && <p>{errorFromSubmit}</p>}
                                </div>
                                <div className="R-inputBox">
                                    <input name="name" type="name" {...register("name", { required: true, maxLength: 10 })} />
                                    <span>이름</span>
                                    <i></i>
                                    {errors.name && errors.name.type === "required" && <p>This name field is required</p>}
                                    {errors.name && errors.name.type === "maxLength" && <p>Your input exceeds the maximum length</p>}
                                </div>
                                <div className="R-inputBox">
                                    <input type="text" />
                                    <span>전화 번호</span>
                                    <i></i>
                                </div>
                            </div>
                        )}
                        {!showPhoneField && (
                            <div>
                                <div className="R-inputBox">
                                    <input type="text" name="companyNumber" onChange={handleCompanyNumberChange} />
                                    <span>회사 부여 번호</span>
                                    <i></i>
                                </div>
                                <div className="R-inputBox1">
                                    <div className="R-select-box">
                                        <select id="team" disabled={isTeamSelectDisabled}>
                                            <option value="">회사 팀</option>
                                            <option value="A">A팀</option>
                                            <option value="B">B팀</option>
                                            <option value="C">C팀</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="buttons-container">
                            {showPhoneField ? (
                                <button type="next" onClick={handleNextClick}>다음</button>
                            ) : (
                                <input type="submit" value="회원가입" disabled={loading} />
                            )}
                            <Link to="/Login">로그인</Link>
                        </div>
                    </form>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Registration;