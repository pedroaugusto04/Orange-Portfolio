import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { NavigationExtras, Router } from "@angular/router";
import { Observable, debounceTime, distinctUntilChanged, map, switchMap } from "rxjs";
import { UserService } from "src/app/appServices/user.service";
import { IUser } from "src/app/models/iUser";

@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
})
export class SearchComponent implements OnInit {
  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {}

  searchForm = this.formBuilder.group({
    search: [""],
  });

  users$?: Observable<IUser[]>;
  defaultIcon: string = "assets/imgs/img_profile_orange_portfolio.png";
  searched: boolean = false;

  ngOnInit(): void {
    this.searchForm
      .get("search")
      ?.valueChanges.pipe(
        map((value) => value!.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(async (value) => {
          this.searched = true;
          this.users$ = this.userService.getUsersByName(value);
        })
      )
      .subscribe();
  }

  loadUserProjects(userId: string, userName: string,userLastName: string,userIconUrl: string): void {
    this.router.navigate(["/discover"],{state : {userId: userId, userName: userName,userLastName: userLastName, userIconUrl:
    userIconUrl}});
  }
}
