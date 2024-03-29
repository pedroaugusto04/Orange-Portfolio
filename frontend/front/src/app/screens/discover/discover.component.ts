import { IProject } from "src/app/models/iProject";
import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, switchMap } from "rxjs";
import { DiscoverService } from "./service/discover.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-discover",
  templateUrl: "./discover.component.html",
  styleUrls: ["./discover.component.scss"],
})
export class DiscoverComponent implements OnInit {
  searchForm = this.formBuilder.group({
    search: [""],
  });

  //controle de mensagem de pesquisa
  searchResultEmpty: boolean = false;

  //controle de dados pesquisados
  searchProjects: IProject[] = [];

  //Array para projetos
  projects: IProject[] = [];

  tags: string[] = [];

  isUniqueUserProjects: boolean = false; // controla quando o discover é geral ou se é para um único usuário

  state: any;
  userName: string = "";
  userLastName: string = "";
  userIconUrl: string = "";
  
  defaultIcon: string = "assets/imgs/img_profile_orange_portfolio.png";

  constructor(
    private formBuilder: FormBuilder,
    private discoverService: DiscoverService,
    private route: Router
  ) {
    this.state = this.route.getCurrentNavigation()?.extras.state;
  }

  ngOnInit(): void {
    if (this.state) {
      const userId = this.state.userId;
      this.userName = this.state.userName;
      this.userLastName = this.state.userLastName;
      this.userIconUrl = this.state.userIconUrl;
      this.isUniqueUserProjects = true;
      this.getProjectsByUserId(userId);
    } else {
      this.getAllProjects();
    }
    this.searchForm
      .get("search")
      ?.valueChanges.pipe(
        map((value) => value!.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(async (value) => {
          this.handleSearch(value);
        })
      )
      .subscribe();
  }

  getAllProjects() {
    this.discoverService.getProjectsDiscover().subscribe({
      next: (projects: IProject[]) => {
        projects.forEach((projectData) => {
          const project = this.discoverService.fillProjectDiscover(projectData);
          this.projects.push(project);
        });
      },
      error: (error) => {
        console.error("Erro ao recuperar projetos:", error);
      },
    });
  }

  getProjectsByUserId(userId: string) {
    this.discoverService.getProjectsDiscoverByUserId(userId).subscribe({
      next: (projects: IProject[]) => {
        projects.forEach((projectData) => {
          const project = this.discoverService.fillProjectDiscover(projectData);
          this.projects.push(project);
        });
      },
      error: (error) => {
        console.error("Erro ao recuperar projetos:", error);
      },
    });
  }

  handleSearch(value: string) {
    const lowerCaseValue = value.toLowerCase();
    this.searchProjects = this.projects.filter((project) => {
      return (
        project.tags && project.tags.some((tag) => tag.toLowerCase().startsWith(lowerCaseValue))
      );
    });
    this.searchResultEmpty = this.searchProjects.length === 0;
  }
}
