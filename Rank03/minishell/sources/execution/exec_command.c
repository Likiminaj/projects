/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   exec_command.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 16:01:31 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/17 14:24:44 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		exec_command(t_ast *ast, t_env *env);
void	exec_ext_command(char **command, char **envp);

/* Analyses the given command and execute it.
Redirect input/output if necessary. */
int	exec_command(t_ast *ast, t_env *env)
{
	int		status;
	pid_t	pid;

	if (!ast->args || !ast->args[0])
		return (0);
	if (is_built_in(ast->args[0]) == 1)
		return (execute_built_in_redirections(ast, env));
	pid = fork();
	if ((pid) == -1)
		return (perror("fork"), 1);
	if (pid == 0)
	{
		ft_restore_signals();
		if (handle_redirections(ast->redirects) == -1)
			exit(1);
		exec_ext_command(ast->args, env->envp);
	}
	waitpid(pid, &status, 0);
	ft_interactive_signals();
	if (WIFEXITED(status))
		return (WEXITSTATUS(status));
	return (128 + WTERMSIG(status));
}

/* Execute in a child process an external command given by user. */
void	exec_ext_command(char **command, char **envp)
{
	char	*path;

	if (!command || !command[0])
		exit(0);
	path = command_path(command[0], envp);
	if (!path)
	{
		ft_putstr_fd(command[0], 2);
		ft_putendl_fd(": command not found", 2);
		exit(127);
	}
	if (execve(path, command, envp) == -1)
	{
		perror(command[0]);
		free(path);
		exit(126);
	}
}
