"""后台密钥安全模块，负责 API Key 入库前加密和执行任务前解密。"""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet


def _build_fernet(secret_key: str) -> Fernet:
    """根据部署密钥派生稳定加密器，保证 Redis 中不存储明文模型 API Key。"""

    digest = hashlib.sha256(secret_key.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_api_key(api_key: str, secret_key: str) -> str:
    """加密后台录入的模型 API Key，输出可安全写入 Redis 的密文字符串。"""

    return _build_fernet(secret_key).encrypt(api_key.encode("utf-8")).decode("utf-8")


def decrypt_api_key(encrypted_api_key: str, secret_key: str) -> str:
    """解密任务执行所需的模型 API Key，仅在 Runner 发起采样请求前使用明文。"""

    return _build_fernet(secret_key).decrypt(encrypted_api_key.encode("utf-8")).decode("utf-8")

