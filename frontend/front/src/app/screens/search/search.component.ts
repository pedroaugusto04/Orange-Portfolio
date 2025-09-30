import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { NavigationExtras, Router } from "@angular/router";
import { Observable, debounceTime, distinctUntilChanged, map, startWith, switchMap } from "rxjs";
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
  ) { }

  searchForm = this.formBuilder.group({
    search: [""],
  });

  users$?: Observable<IUser[]>;
  defaultIcon: string = "assets/imgs/img_profile_orange_portfolio.png";
  searched: boolean = false;

  filteredUsers$!: Observable<IUser[]>;

  ngOnInit(): void {
    this.users$ = this.userService.getUsers();

    this.searchForm
      .get("search")
      ?.valueChanges.pipe(
        map((value) => value!.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(async (value) => {
          if (value.length == 0) {
            this.searched = false;
            this.users$ = this.userService.getUsers();
          } else {
            this.searched = true;
            this.users$ = this.userService.getUsersByName(value);
          }
        })
      )
      .subscribe();

    this.filteredUsers$ = this.searchForm.get("search")!.valueChanges.pipe(
      startWith(""),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        const term = (value || "").trim();
        if (!term) {
          return this.userService.getUsers();
        }
        return this.userService.getUsersByName(term); 
      })
    );
  }

  loadUserProjects(userId: string, userName: string, userLastName: string, userIconUrl: string): void {
    this.router.navigate(["/discover"], {
      state: {
        userId: userId, userName: userName, userLastName: userLastName, userIconUrl:
          userIconUrl
      }
    });
  }
}
