/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   exec_command_utils.c                               :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 15:39:36 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/05 16:10:14 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		is_built_in(char *command);
int		execute_built_in(char *command, t_ast *ast, t_env *env);
char	*command_path(char *command, char **envp);
char	*check_absolute_path(char *command);
char	*search_in_paths(char *command, char **all_paths);

/* Checks if the command provided is a built-in command. */
int	is_built_in(char *command)
{
	if (!command)
		return (0);
	if (ft_strcmp(command, "cd") == 0
		|| ft_strcmp(command, "echo") == 0
		|| ft_strcmp(command, "env") == 0
		|| ft_strcmp(command, "exit") == 0
		|| ft_strcmp(command, "export") == 0
		|| ft_strcmp(command, "pwd") == 0
		|| ft_strcmp(command, "unset") == 0)
		return (1);
	return (0);
}

/* Executes the function associated to the built-in command provided.*/
int	execute_built_in(char *command, t_ast *ast, t_env *env)
{
	if (!command)
		return (0);
	if (ft_strcmp(command, "cd") == 0)
		return (builtin_cd(ast, env));
	else if (ft_strcmp(command, "echo") == 0)
		return (builtin_echo(ast));
	else if (ft_strcmp(command, "env") == 0)
		return (builtin_env(ast, env));
	else if (ft_strcmp(command, "exit") == 0)
		return (builtin_exit(ast, env));
	else if (ft_strcmp(command, "export") == 0)
		return (builtin_export(ast, env));
	else if (ft_strcmp(command, "pwd") == 0)
		return (builtin_pwd(ast, env));
	else if (ft_strcmp(command, "unset") == 0)
		return (builtin_unset(ast, env));
	else
		return (0);
}

/* Find what is the PATH to launch the command given by the user> */
char	*command_path(char *command, char **envp)
{
	int		i;
	char	**all_paths;
	char	*path;

	path = check_absolute_path(command);
	if (path)
		return (path);
	i = 0;
	while (envp[i] && ft_strnstr(envp[i], "PATH=", 5) == NULL)
		i++;
	if (!envp[i] || !envp[i][5])
		return (NULL);
	all_paths = ft_split(envp[i] + 5, ':');
	if (!all_paths)
		return (NULL);
	path = search_in_paths(command, all_paths);
	free_array(all_paths);
	return (path);
}

/* Check if path is absolute. */
char	*check_absolute_path(char *command)
{
	if (command[0] == '/' || command[0] == '.')
		return (ft_strdup(command));
	return (NULL);
}

/* Tries all the possible paths until correct path is found. */
char	*search_in_paths(char *command, char **all_paths)
{
	int		i;
	char	*current_path;
	char	*full_path;

	i = 0;
	while (all_paths[i] != NULL)
	{
		current_path = ft_strjoin(all_paths[i], "/");
		full_path = ft_strjoin(current_path, command);
		free(current_path);
		if (access(full_path, X_OK) == 0)
			return (full_path);
		free(full_path);
		i++;
	}
	return (NULL);
}
