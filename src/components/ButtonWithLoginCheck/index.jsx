import React from 'react';
import { WebLoginState, useWebLogin } from "aelf-web-login"
import {
  Button,
} from "antd";

export default function ButtonWithLoginCheck({ children, onClick, ...props }) {
  const { loginState, login } = useWebLogin();

  const onClickInternal = (event) => {
    if (loginState === WebLoginState.initial || 
      loginState === WebLoginState.eagerly || 
      loginState === WebLoginState.lock) {
      login();
    } 
    else if (loginState === WebLoginState.logined) {
      onClick?.(event);
    }
  };

  return (<Button {...props} onClick={onClickInternal} 
    loading={loginState === WebLoginState.logining || loginState === WebLoginState.logouting}>{children}</Button>);
}
