/*******************************************************************************
 * Copyright © 2020-2021 VMware, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 *******************************************************************************/

package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/phanvanhai/edugroup-ui-go/internal/domain"
	"github.com/phanvanhai/edugroup-ui-go/internal/errors"
	"github.com/phanvanhai/edugroup-ui-go/internal/repository"
)

func GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := repository.GetUserRepos().SelectAll()
	if err != nil {
		http.Error(w, errors.NewErrWriteDatabase().Error(), http.StatusInternalServerError)
		return
	}

	response, err := json.Marshal(users)

	if err != nil {
		http.Error(w, errors.NewErrWriteDatabase().Error(), http.StatusInternalServerError)
		return
	}

	w.Write(response)
}

func AddUser(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var cred domain.Credential
	err := json.NewDecoder(r.Body).Decode(&cred)
	if err != nil {
		http.Error(w, errors.NewErrParserJsonBody().Error(), http.StatusBadRequest)
		return
	}
	err = validateUser(cred)
	if err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	// TODO: dang mac dinh la role = user
	u := domain.User{Name: cred.Username, Password: cred.Password, Role: "user"}
	id, err := repository.GetUserRepos().Insert(u)
	if err != nil {
		http.Error(w, errors.NewErrWriteDatabase().Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte(id))
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var user domain.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, errors.NewErrParserJsonBody().Error(), http.StatusBadRequest)
		return
	}

	err = repository.GetUserRepos().Update(user)
	if err != nil {
		http.Error(w, errors.NewErrWriteDatabase().Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("true"))
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	var user domain.User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, errors.NewErrParserJsonBody().Error(), http.StatusBadRequest)
		return
	}

	err = repository.GetUserRepos().Delete(string(user.Id))
	if err != nil {
		http.Error(w, errors.NewErrWriteDatabase().Error(), http.StatusInternalServerError)
		return
	}
	w.Write([]byte("true"))
}

func validateUser(cred domain.Credential) error {
	_, err := repository.GetUserRepos().SelectByName(cred.Username)
	if err == nil {
		return errors.NewErrDuplicateName(fmt.Sprintf("Duplicate user: %s", cred.Username))
	}
	return nil
}
