/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   exec_command.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 16:01:31 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/26 20:16:24 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		exec_command(t_ast *ast, t_env *env);
void	exec_ext_command(char **command, char **envp);
void	exec_command_child(t_ast *ast, t_env *env);
int		handle_child_status(int status);

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
	signal(SIGINT, SIG_IGN);
	signal(SIGQUIT, SIG_IGN);
	pid = fork();
	if ((pid) == -1)
		return (ft_interactive_signals(), perror("fork"), 1);
	if (pid == 0)
		exec_command_child(ast, env);
	waitpid(pid, &status, 0);
	ft_interactive_signals();
	return (handle_child_status(status));
}

/* Execute in a child process an external command given by user. */
void	exec_ext_command(char **command, char **envp)
{
	char		*path;
	struct stat	st;

	if (!command || !command[0])
		exit(0);
	path = command_path(command[0], envp);
	if (!path)
	{
		ft_putstr_fd(command[0], 2);
		ft_putendl_fd(": command not found", 2);
		exit(127);
	}
	if (stat(path, &st) == 0 && S_ISDIR(st.st_mode))
	{
		ft_putstr_fd(command[0], 2);
		ft_putendl_fd(": Is a directory", 2);
		free(path);
		exit(126);
	}
	if (execve(path, command, envp) == -1)
	{
		perror(command[0]);
		free(path);
		exit(126);
	}
}

void	exec_command_child(t_ast *ast, t_env *env)
{
	ft_restore_signals();
	if (handle_redirections(ast->redirects) == -1)
		exit(1);
	exec_ext_command(ast->args, env->envp);
}

int	handle_child_status(int status)
{
	if (WIFSIGNALED(status))
	{
		if (WTERMSIG(status) == SIGINT)
			write(1, "\n", 1);
		return (128 + WTERMSIG(status));
	}
	if (WIFEXITED(status))
		return (WEXITSTATUS(status));
	return (1);
}
