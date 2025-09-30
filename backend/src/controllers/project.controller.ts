import { ProjectService } from "../services/project.service";
import { Request, Response } from "express";
import { Project } from "../models/project.model";
import { uploadFile } from "../utils/fileUploadUtils";
import { UserService } from "../services/user.service";
import * as dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

export class ProjectController {
  public static async createProject(req: Request, res: Response) {
    const newProject: Project = req.body;
    
    if (
      !newProject ||
      !newProject.title ||
      !newProject.description ||
      !newProject.imgDescription ||
      !newProject.tags ||
      !newProject.link ||
      !newProject.idUser 
    ) {
      return res
        .status(422)
        .json({ message: "Solicitação inválida. Verifique os parâmetros enviados." });
    }

    const userExists = await UserService.getUserById(newProject.idUser);
    if (!userExists)
      return res.status(404).json({ message: "Solicitação inválida. Usuário não encontrado." });

    if (req.files && "imgUrl" in req.files) {
      let downloadUrl = await uploadFile(req.files["imgUrl"][0]);
      newProject.imgUrl = downloadUrl ? downloadUrl : "";
    }
    const createdProject = await ProjectService.createProject(newProject);
    return res.status(201).json(createdProject);
  }

  public static async getAllProjects(req: Request, res: Response) {
    const projects = await ProjectService.getAllProjects();

    if (!projects) return res.status(500);
    return res.status(200).json(projects);
  }

  public static async getAllProjectsByUserId(req: Request, res: Response) {
    const userId = req.params.userId;
    const projects = await ProjectService.getAllProjectsByUserId(userId);

    if (projects.length == 0)
      return res.status(404).json({ message: "Esse usuário não tem projetos" });
    return res.status(200).json(projects);
  }

  public static async updateProject(req: Request, res: Response) {
    const projectId = req.params.id;
    const updatedProject: Project = req.body;

    const userExists = await UserService.getUserById(updatedProject.idUser);
    const projectExists = await ProjectService.getProjectById(projectId);

    if (!userExists)
      return res.status(404).json({ message: "Solicitação inválida. Usuário não encontrado." });
    if (!projectExists)
      return res.status(404).json({ message: "Solicitação inválida. Projeto não encontrado." });

    if (
      !updatedProject ||
      !updatedProject.title ||
      !updatedProject.description ||
      !updatedProject.imgDescription ||
      !updatedProject.tags ||
      !updatedProject.link
    ) {
      return res
        .status(422)
        .json({ message: "Solicitação inválida. Verifique os parâmetros enviados." });
    }

    if (req.files) {
      let downloadUrl;
      if ("imgUrl" in req.files) {
        downloadUrl = await uploadFile(req.files["imgUrl"][0]);
        updatedProject.imgUrl = downloadUrl;
      }
    }
    const updated = await ProjectService.updateProject(projectId, updatedProject);

    return res.status(200).json(updated);
  }

  public static async deleteProject(req: Request, res: Response) {
    const projectId = req.params.id;
    const result = await ProjectService.deleteProjectById(projectId);

    if (result) {
      return res.status(204).json({ message: "Projeto deletado com sucesso." });
    } else {
      return res.status(404).json({ message: "Projeto não encontrado." });
    }
  }

  public static async getWordSuggestion(req: Request, res: Response) {
    try {
      const { prefix } = req.query;

      if (!prefix || typeof prefix !== 'string') {
        return res.status(422).json({ message: "Parâmetro 'prefix' é obrigatório e deve ser uma string." });
      }

      const prompt = `A partir do prefixo ou da palavra/frase incompleta "${prefix}", sugira a continuação mais provável em português, como faria um sistema de autocomplete de navegador. Respeite a continuação literal do que foi digitado e complete a palavra/frase de forma natural. O contexto é um site de busca de projetos e portfólios de outros usuários, então priorize termos relacionados a esse tema quando aplicável. Responda APENAS com a palavra ou frase completa, sem frases adicionais, pontuação ou explicações.`;

      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;

      const suggestion = response.text().trim().split(' ')[0]; 

      return res.status(200).json({ suggestion });

    } catch (error) {
      return res.status(500).json({ message: "Ocorreu um erro interno ao gerar a sugestão." });
    }
  }
}
