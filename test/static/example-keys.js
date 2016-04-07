'use strict';

const
	private_key_pem = `-----BEGIN RSA PRIVATE KEY-----
MIICXwIBAAKBgQDPDAwq16iDpIPy92yQ3TnCifV05K+TM4weOnskyX93dZFQUoJv
mQOXSZ7iaH++BW8Jo2KGtkzaANQs78Rv73Y+oF9ns101Edw4IaRx4ZSWnqCrBSgi
a+RqtL0c8Od1mQk9SiFEuIUaH610eLyLYpOttlaQ7ctkeBiZXDyBf3G29wIDAQAB
AoGBAJsP0MT9Qm1k9pUujJZpuGpj2/qxknTR9Cxna/Z/GgGjgTMAuENP+4qATogN
7y2m8CPtw0pUmXXjjQQihaG3W3vuhNQDU+hhW07X33/occuQOhQ7v20d4Q9fe3vO
0wpfnFu+iTm6GiPUbZLDmDZPZs2+z5FKRHmS14HjX1rTtJABAkEA8ByXXbHDqNun
ps+n+FT7d01VyTz+7ThW47sSd+JbTruXn8mB7wowcpc/0pWZ5Dzqv/Qt0v5ULD5n
yVeu6jhy9wJBANy/Wl0eQ6lNwbCH6NdEHMk5gIlFIHvVeT1DCHKJm6tFW4DHUHCw
DSPs/rOX4CCFvTokAY91PdKx6epDBKi73AECQQCgE6+mO1kiPi6rO03UdXOgueIz
Y4LhS+pBsPpDCpmtB8uyL3l8j+J0wvk9v5b1XtdyWawjOoOLa59t0BNA+5lJAkEA
wYLxiU3djI5AbCtIX2UzQucoma1Co6voo16fCiE9mK+tXj/bcV2ztzmrse5CqN/0
mQI1Z/gkIQ6b+yOS8wP0AQJBANZVhXFmqa4WYCkKiByZY3XIxsZA+UZpUFTEaJ+1
IsOT8396XpxCM5r4v4PDC9Xx9j+b+09bSoBJBuCLXgzdIag=
-----END RSA PRIVATE KEY-----`,
	public_key_pem = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDPDAwq16iDpIPy92yQ3TnCifV0
5K+TM4weOnskyX93dZFQUoJvmQOXSZ7iaH++BW8Jo2KGtkzaANQs78Rv73Y+oF9n
s101Edw4IaRx4ZSWnqCrBSgia+RqtL0c8Od1mQk9SiFEuIUaH610eLyLYpOttlaQ
7ctkeBiZXDyBf3G29wIDAQAB
-----END PUBLIC KEY-----`,
	jwk_n = 'zwwMKteog6SD8vdskN05won1dOSvkzOMHjp7JMl_d3WRUFKCb5kDl0me4mh_vgVvCaNihrZM2gDULO_Eb-92PqBfZ7NdNRHcOCGkceGUlp6gqwUoImvkarS9HPDndZkJPUohRLiFGh-tdHi8i2KTrbZWkO3LZHgYmVw8gX9xtvc',
	jwk_e = 'AQAB';

module.exports = {
	pem: () => ({
		private_key: private_key_pem,
		public_key: public_key_pem
	}),
	jwk: (kid) => ({
		private_key: {
			n: jwk_n,
			e: jwk_e,
			pem: private_key_pem.toString(),
			kid: kid
		},
		public_key: {
			n: jwk_n,
			e: jwk_e,
			pem: public_key_pem.toString(),
			kid: kid
		}
	})
};
