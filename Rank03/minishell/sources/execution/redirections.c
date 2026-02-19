/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   redirections.c                                     :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: chlpesty <chlpesty@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2026/02/04 17:23:57 by chlpesty          #+#    #+#             */
/*   Updated: 2026/02/05 16:28:08 by chlpesty         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "../minishell.h"
#include "../../libft/libft.h"

int		handle_redirections(t_redirect *redirects);
int		execute_built_in_redirections(t_ast *ast, t_env *env);
int		heredoc_handling(char *delimiter);
void	read_heredoc_lines(int write_fd, char *delimiter);

/* Handles < (input), > (output), >> (append), << (heredoc).*/
int	handle_redirections(t_redirect *redirects)
{
	t_redirect	*current;
	int			fd;

	current = redirects;
	while (current)
	{
		if (current->type == REDIR_IN)
			fd = open(current->file, O_RDONLY);
		else if (current->type == REDIR_OUT)
			fd = open(current->file, O_WRONLY | O_CREAT | O_TRUNC, 0644);
		else if (current->type == REDIR_APPEND)
			fd = open(current->file, O_WRONLY | O_CREAT | O_APPEND, 0644);
		else if (current->type == REDIR_HEREDOC)
			fd = heredoc_handling(current->file);
		if (fd == -1)
			return (perror(current->file), -1);
		if (current->type == REDIR_IN || current->type == REDIR_HEREDOC)
			dup2(fd, STDIN_FILENO);
		else
			dup2(fd, STDOUT_FILENO);
		close(fd);
		current = current->next;
	}
	return (0);
}

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
	if (handle_redirections(ast->redirects) == -1)
		return (close(saved_stdin), close(saved_stdout), 1);
	exit_status = execute_built_in(ast->args[0], ast, env);
	dup2(saved_stdin, STDIN_FILENO);
	dup2(saved_stdout, STDOUT_FILENO);
	close(saved_stdin);
	close(saved_stdout);
	return (exit_status);
}

/* Creates pipe, forks child to read heredoc, signal handling, returns fd. */
int	heredoc_handling(char *delimiter)
{
	int		fd[2];
	int		status;
	pid_t	pid;

	if (!delimiter || !delimiter[0])
		return (-1);
	if (pipe(fd) == -1)
		return (perror("pipe"), -1);
	pid = fork();
	if (pid == -1)
		return (perror("fork"), close(fd[0]), close(fd[1]), -1);
	if (pid == 0)
	{
		close(fd[0]);
		ft_heredoc_signals();
		read_heredoc_lines(fd[1], delimiter);
		close(fd[1]);
		exit(0);
	}
	close(fd[1]);
	waitpid(pid, &status, 0);
	if (WIFSIGNALED(status))
		return (close(fd[0]), -1);
	return (fd[0]);
}

/* Reads lines from stdin until delimiter, writes to pipe fd. */
void	read_heredoc_lines(int write_fd, char *delimiter)
{
	char	*line;
	int		len;

	len = ft_strlen(delimiter);
	while (1)
	{
		write(1, "> ", 2);
		line = get_next_line(0);
		if (!line)
			break ;
		if (ft_strncmp(line, delimiter, len) == 0 && line[len] == '\n')
		{
			free(line);
			break ;
		}
		write(write_fd, line, ft_strlen(line));
		free(line);
	}
}
