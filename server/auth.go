package main

import (
	"errors"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

var SIGNING_KEY = []byte("abc123")

type Token struct {
	PlayerId   uuid.UUID `json:"playerId"`
	RoomId     string    `json:"roomId"`
	PlayerName string    `json:"playerName"`
}

func ParseJwt(tokenString string) (*Token, error) {
	type Claims struct {
		*Token
		PlayerId string `json:"playerId"`
		jwt.StandardClaims
	}
	token, err := jwt.ParseWithClaims(tokenString, &Claims{},
		func(token *jwt.Token) (interface{}, error) {
			return SIGNING_KEY, nil
		})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok {
		playerId, err := uuid.Parse(claims.PlayerId)
		if err != nil {
			return nil, err
		}
		return &Token{
			PlayerId:   playerId,
			PlayerName: claims.PlayerName,
			RoomId:     claims.RoomId,
		}, nil
	} else {
		return nil, errors.New("unknow error")
	}
}

func GenerateNewJWT(roomId string, playerId uuid.UUID, playerName string) (string, error) {
	jwtToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"playerId":   playerId.String(),
		"roomId":     roomId,
		"playerName": playerName,
	})

	validToken, err := jwtToken.SignedString(SIGNING_KEY)
	if err != nil {
		return "", err
	}
	return validToken, nil
}

func GetPlayerIdFromToken(tokenString string) (uuid.UUID, error) {
	type Claims struct {
		PlayerId string `json:"playerId"`
		jwt.StandardClaims
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return SIGNING_KEY, nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok {
		playerId, err := uuid.Parse(claims.PlayerId)
		if err != nil {
			return uuid.Nil, err
		}
		return playerId, nil
	} else {
		return uuid.Nil, errors.New("unknow error")
	}
}
