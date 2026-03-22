/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   redirections.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 17:23:57 by chlpesty          #+#    #+#             */
/*   Updated: 2026/03/20 16:15:16 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		execute_built_in_redirections(t_ast *ast, t_env *env);
int		heredoc_handling(char *delimiter, int line_count);
int		check_heredoc_status(int status, int fd);

/* Executes built-in with redirections, then restores original stdin/stdout
to prevent affecting other commands in the parent process. */
int	execute_built_in_redirections(t_ast *ast, t_env *env)
{
	int	saved_stdin;
	int	saved_stdout;
	int	exit_status;

	saved_stdin = dup(STDIN_FILENO);
	saved_stdout = dup(STDOUT_FILENO);
	if (saved_stdin == -1 || saved_stdout == -1)
	{
		if (saved_stdin != -1)
			close(saved_stdin);
		if (saved_stdout != -1)
			close(saved_stdout);
		return (1);
	}
	if (handle_redirections(ast->redirects, env->line_count) == -1)
		return (close(saved_stdin), close(saved_stdout), 1);
	exit_status = execute_built_in(ast->args[0], ast, env);
	dup2(saved_stdin, STDIN_FILENO);
	dup2(saved_stdout, STDOUT_FILENO);
	close(saved_stdin);
	close(saved_stdout);
	return (exit_status);
}

/* Creates pipe, forks child to read heredoc, signal handling, returns fd. */
int	heredoc_handling(char *delimiter, int line_count)
{
	int				fd[2];
	int				status;
	pid_t			pid;
	struct termios	saved;

	if (!delimiter || !delimiter[0])
		return (-1);
	if (pipe(fd) == -1)
		return (perror("pipe"), -1);
	setup_heredoc_term(&saved);
	pid = fork();
	if (pid == -1)
		return (tcsetattr(STDIN_FILENO, TCSANOW, &saved),
			perror("fork"), close(fd[0]), close(fd[1]), -1);
	if (pid == 0)
		heredoc_child(fd, delimiter, line_count);
	close(fd[1]);
	waitpid(pid, &status, 0);
	tcsetattr(STDIN_FILENO, TCSANOW, &saved);
	return (check_heredoc_status(status, fd[0]));
}

/* Checks heredoc child exit status and sets signal flag if interrupted. */
int	check_heredoc_status(int status, int fd)
{
	if (WIFEXITED(status) && WEXITSTATUS(status) == 130)
	{
		g_signal = SIGINT;
		return (close(fd), -1);
	}
	if (WIFSIGNALED(status))
	{
		g_signal = WTERMSIG(status);
		return (close(fd), -1);
	}
	return (fd);
}
